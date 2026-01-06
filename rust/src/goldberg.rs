use glam::Vec3;
use rayon::prelude::*;
use serde::Deserialize;
use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone)]
pub enum CellType {
    Pentagon,
    Hexagon,
}

#[derive(Debug, Clone)]
pub struct Cell {
    pub id: usize,
    pub cell_type: CellType,
    pub center: Vec3,
    pub vertices: Vec<Vec3>,
    pub neighbors: Vec<usize>,
    pub is_land: bool,
}

#[derive(Deserialize)]
struct GeoJson {
    features: Vec<Feature>,
}

#[derive(Deserialize)]
struct Feature {
    geometry: Geometry,
}

#[derive(Deserialize)]
#[serde(tag = "type")]
enum Geometry {
    Polygon { coordinates: Vec<Vec<[f32; 2]>> },
    MultiPolygon { coordinates: Vec<Vec<Vec<[f32; 2]>>> },
}

const PHI: f32 = 1.61803398875;

fn point_in_polygon(point: [f32; 2], poly: &[[f32; 2]]) -> bool {
    let mut inside = false;
    let mut j = poly.len() - 1;
    for i in 0..poly.len() {
        if ((poly[i][1] > point[1]) != (poly[j][1] > point[1])) &&
           (point[0] < (poly[j][0] - poly[i][0]) * (point[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]) {
            inside = !inside;
        }
        j = i;
    }
    inside
}

fn is_land(pos: Vec3, geojson: &GeoJson) -> bool {
    let lon = (-pos.x).atan2(pos.z).to_degrees();
    let lat = pos.y.asin().to_degrees();
    let p = [lon, lat];

    for feature in &geojson.features {
        match &feature.geometry {
            Geometry::Polygon { coordinates } => {
                if is_in_rings(p, coordinates) { return true; }
            }
            Geometry::MultiPolygon { coordinates } => {
                for poly in coordinates {
                    if is_in_rings(p, poly) { return true; }
                }
            }
        }
    }
    false
}

fn is_in_rings(p: [f32; 2], rings: &Vec<Vec<[f32; 2]>>) -> bool {
    if rings.is_empty() || !point_in_polygon(p, &rings[0]) { return false; }
    for hole in rings.iter().skip(1) {
        if point_in_polygon(p, hole) { return false; }
    }
    true
}

pub fn generate_goldberg(m: i32, n: i32, land_json_path: &str) -> Vec<Cell> {
    let ico_verts: Vec<Vec3> = vec![
        Vec3::new(-1.0,  PHI, 0.0), Vec3::new( 1.0,  PHI, 0.0),
        Vec3::new(-1.0, -PHI, 0.0), Vec3::new( 1.0, -PHI, 0.0),
        Vec3::new( 0.0, -1.0,  PHI), Vec3::new( 0.0,  1.0,  PHI),
        Vec3::new( 0.0, -1.0, -PHI), Vec3::new( 0.0,  1.0, -PHI),
        Vec3::new( PHI, 0.0, -1.0), Vec3::new( PHI, 0.0,  1.0),
        Vec3::new(-PHI, 0.0, -1.0), Vec3::new(-PHI, 0.0,  1.0),
    ].into_iter().map(|v| v.normalize()).collect();

    let ico_faces = vec![
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    let det = (m * (m + n) - (-n * n)) as f32;
    let mut grid_points = Vec::new();
    let min_u = 0.min(m).min(-n);
    let max_u = 0.max(m).max(-n);
    let min_v = 0.min(n).min(m + n);
    let max_v = 0.max(n).max(m + n);

    for u in min_u..=max_u {
        for v in min_v..=max_v {
            let wb = (u * (m + n) - v * (-n)) as f32 / det;
            let wc = (m * v - n * u) as f32 / det;
            let wa = 1.0 - wb - wc;
            if wa >= -0.0001 && wb >= -0.0001 && wc >= -0.0001 {
                grid_points.push((wa, wb, wc));
            }
        }
    }

    let mut unique_centers: Vec<Vec3> = Vec::new();
    let bucket_size = 0.05;
    let mut spatial_map: HashMap<(i32, i32, i32), Vec<usize>> = HashMap::new();

    for face in &ico_faces {
        let va = ico_verts[face[0]];
        let vb = ico_verts[face[1]];
        let vc = ico_verts[face[2]];
        for &(wa, wb, wc) in &grid_points {
            let pos = (va * wa + vb * wb + vc * wc).normalize();
            let key = ((pos.x / bucket_size).floor() as i32, (pos.y / bucket_size).floor() as i32, (pos.z / bucket_size).floor() as i32);
            
            let mut found = false;
            for dx in -1..=1 {
                for dy in -1..=1 {
                    for dz in -1..=1 {
                        if let Some(indices) = spatial_map.get(&(key.0 + dx, key.1 + dy, key.2 + dz)) {
                            for &idx in indices {
                                if unique_centers[idx].distance(pos) < 0.001 {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if found { break; }
                    }
                    if found { break; }
                }
                if found { break; }
            }

            if !found {
                let idx = unique_centers.len();
                unique_centers.push(pos);
                spatial_map.entry(key).or_default().push(idx);
            }
        }
    }

    let geo_data: GeoJson = serde_json::from_str(&std::fs::read_to_string(land_json_path).expect("Failed to read land.json")).expect("Failed to parse land.json");

    unique_centers.par_iter().enumerate().map(|(i, &center)| {
        let mut candidates = Vec::new();
        let key = ((center.x / bucket_size).floor() as i32, (center.y / bucket_size).floor() as i32, (center.z / bucket_size).floor() as i32);
        for dx in -2..=2 {
            for dy in -2..=2 {
                for dz in -2..=2 {
                    if let Some(indices) = spatial_map.get(&(key.0 + dx, key.1 + dy, key.2 + dz)) {
                        for &other_idx in indices {
                            if i == other_idx { continue; }
                            let d = center.distance(unique_centers[other_idx]);
                            if d < 0.1 { candidates.push((other_idx, d)); }
                        }
                    }
                }
            }
        }
        candidates.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());
        
        let mut neighbors = vec![candidates[0].0, candidates[1].0, candidates[2].0, candidates[3].0, candidates[4].0];
        if candidates.len() > 5 && candidates[5].1 < candidates[4].1 * 1.5 {
            neighbors.push(candidates[5].0);
        }

        let up = center;
        let arb = if up.y.abs() > 0.9 { Vec3::X } else { Vec3::Y };
        let right = up.cross(arb).normalize();
        let forward = right.cross(up).normalize();

        neighbors.sort_by(|&a_idx, &b_idx| {
            let a = unique_centers[a_idx] - center;
            let b = unique_centers[b_idx] - center;
            let ang_a = a.dot(forward).atan2(a.dot(right));
            let ang_b = b.dot(forward).atan2(b.dot(right));
            ang_a.partial_cmp(&ang_b).unwrap()
        });

        let vertices = neighbors.iter().enumerate().map(|(k, &n_idx)| {
            let n1 = unique_centers[n_idx];
            let n2 = unique_centers[neighbors[(k + 1) % neighbors.len()]];
            (center + n1 + n2).normalize()
        }).collect();

        Cell {
            id: i,
            cell_type: if neighbors.len() == 5 { CellType::Pentagon } else { CellType::Hexagon },
            center,
            vertices,
            neighbors,
            is_land: is_land(center, &geo_data),
        }
    }).collect()
}

pub fn find_path(neighbors_map: &HashMap<usize, Vec<usize>>, start: usize, end: usize) -> Vec<usize> {
    if start == end { return vec![start]; }
    let mut queue = VecDeque::from([start]);
    let mut visited = HashMap::from([(start, start)]);
    
    while let Some(curr) = queue.pop_front() {
        if curr == end {
            let mut path = vec![end];
            let mut c = end;
            while c != start {
                c = *visited.get(&c).expect("Path reconstruction failed");
                path.push(c);
            }
            path.reverse();
            return path;
        }
        if let Some(neighbors) = neighbors_map.get(&curr) {
            for &n in neighbors {
                if !visited.contains_key(&n) {
                    visited.insert(n, curr);
                    queue.push_back(n);
                }
            }
        }
    }
    vec![]
}