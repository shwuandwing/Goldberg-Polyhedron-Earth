mod goldberg;

use bevy::{
    prelude::*,
    render::{mesh::{Indices, PrimitiveTopology}, render_asset::RenderAssetUsages},
};
use goldberg::{generate_goldberg, find_path, Cell};
use std::collections::HashMap;

fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_systems(Startup, setup)
        .add_systems(Update, (orbit_camera, handle_click, update_ui))
        .init_resource::<BoardData>()
        .run();
}

#[derive(Resource, Default)]
struct BoardData {
    cells: Vec<Cell>,
    neighbors: HashMap<usize, Vec<usize>>,
    entity_map: HashMap<usize, Entity>,
    start_id: Option<usize>,
    end_id: Option<usize>,
    hovered_id: Option<usize>,
    current_path: Vec<usize>,
}

#[derive(Component)]
struct CellComponent {
    id: usize,
    original_color: Color,
}

#[derive(Component)]
struct OrbitCamera {
    distance: f32,
    y_angle: f32,
    x_angle: f32,
}

#[derive(Component)]
struct HoverText;
#[derive(Component)]
struct SelectionText;

fn setup(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut board_data: ResMut<BoardData>,
) {
    let cells = generate_goldberg(20, 20, "assets/land.json");
    let mut neighbors_map = HashMap::new();
    let mut entity_map = HashMap::new();

    for cell in &cells {
        neighbors_map.insert(cell.id, cell.neighbors.clone());

        let mut mesh = Mesh::new(PrimitiveTopology::TriangleList, RenderAssetUsages::default());
        let mut positions = Vec::new();
        let mut normals = Vec::new();
        let mut indices = Vec::new();

        positions.push([cell.center.x, cell.center.y, cell.center.z]);
        normals.push([cell.center.x, cell.center.y, cell.center.z]);

        for v in &cell.vertices {
            positions.push([v.x, v.y, v.z]);
            normals.push([v.x, v.y, v.z]);
        }

        for i in 1..cell.vertices.len() {
            indices.push(0);
            indices.push(i as u32);
            indices.push((i + 1) as u32);
        }
        indices.push(0);
        indices.push(cell.vertices.len() as u32);
        indices.push(1);

        mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, positions);
        mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);
        mesh.insert_indices(Indices::U32(indices));

        let color = if cell.is_land {
            Color::srgb(0.12, 0.52, 0.29) 
        } else {
            Color::srgb(0.16, 0.45, 0.65)
        };

        let entity = commands.spawn((
            Mesh3d(meshes.add(mesh)),
            MeshMaterial3d(materials.add(StandardMaterial {
                base_color: color,
                ..default()
            })),
            CellComponent { id: cell.id, original_color: color },
        )).id();

        entity_map.insert(cell.id, entity);
    }

    board_data.cells = cells;
    board_data.neighbors = neighbors_map;
    board_data.entity_map = entity_map;

    commands.spawn((
        Node {
            position_type: PositionType::Absolute,
            top: Val::Px(20.0),
            left: Val::Px(20.0),
            padding: UiRect::all(Val::Px(20.0)),
            flex_direction: FlexDirection::Column,
            ..default()
        },
        BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.85)),
        BorderRadius::all(Val::Px(12.0)),
    )).with_children(|parent| {
        parent.spawn((
            Text::new("Rust Goldberg Earth"),
            TextFont { font_size: 24.0, ..default() },
            TextColor(Color::srgb(0.18, 0.8, 0.44)),
        ));

        parent.spawn((
            Text::new("Resolution: GP(20, 20)\nCells: 12,002"),
            TextFont { font_size: 14.0, ..default() },
        ));

        parent.spawn((
            Node {
                width: Val::Px(200.0),
                height: Val::Px(1.0),
                margin: UiRect::vertical(Val::Px(10.0)),
                ..default()
            },
            BackgroundColor(Color::srgba(1.0, 1.0, 1.0, 0.2)),
        ));

        parent.spawn((
            Text::new("Hover to explore..."),
            TextFont { font_size: 16.0, ..default() },
            HoverText,
        ));

        parent.spawn((
            Text::new("Start: ---\nEnd: ---\nPath: ---"),
            TextFont { font_size: 16.0, ..default() },
            SelectionText,
        ));

        parent.spawn(( 
            Text::new("\nLeft Click: Orbit\nRight Click: Select Cells"),
            TextFont { font_size: 12.0, ..default() },
            TextColor(Color::srgb(0.7, 0.7, 0.7)),
        ));
    });

    commands.spawn((
        PointLight {
            intensity: 2_000_000.0,
            ..default()
        },
        Transform::from_xyz(4.0, 8.0, 4.0),
    ));
    commands.insert_resource(AmbientLight {
        brightness: 500.0,
        ..default()
    });

    commands.spawn((
        Camera3d::default(),
        OrbitCamera {
            distance: 5.0,
            y_angle: 0.0,
            x_angle: 0.0,
        },
    ));
}

fn orbit_camera(
    mouse_button: Res<ButtonInput<MouseButton>>,
    mut mouse_motion: EventReader<bevy::input::mouse::MouseMotion>,
    mut query: Query<(&mut OrbitCamera, &mut Transform)>,
) {
    let (mut orbit, mut transform) = query.single_mut();
    if mouse_button.pressed(MouseButton::Left) {
        for ev in mouse_motion.read() {
            orbit.y_angle -= ev.delta.x * 0.005;
            orbit.x_angle -= ev.delta.y * 0.005;
        }
    }
    let rotation = Quat::from_rotation_y(orbit.y_angle) * Quat::from_rotation_x(orbit.x_angle);
    transform.translation = rotation * Vec3::Z * orbit.distance;
    transform.look_at(Vec3::ZERO, Vec3::Y);
}

fn handle_click(
    mouse_button: Res<ButtonInput<MouseButton>>,
    camera_query: Query<(&Camera, &GlobalTransform)>,
    window_query: Query<&Window>,
    mut board_data: ResMut<BoardData>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mesh_query: Query<(&MeshMaterial3d<StandardMaterial>, &CellComponent)>,
) {
    let window = window_query.single();
    let (camera, camera_transform) = camera_query.single();

    if let Some(cursor_pos) = window.cursor_position() {
        if let Ok(ray) = camera.viewport_to_world(camera_transform, cursor_pos) {
            // Robust picking: Intersect ray with unit sphere
            // Ray: P = O + tD. Sphere: |P| = 1 => |O + tD|^2 = 1
            // t^2 + 2t(O.D) + (|O|^2 - 1) = 0
            let oc = ray.origin;
            let dir = *ray.direction;
            let b = oc.dot(dir);
            let c = oc.dot(oc) - 1.0;
            let h = b * b - c;
            
            let mut closest_id = None;
            if h >= 0.0 {
                let t = -b - h.sqrt();
                if t > 0.0 {
                    let hit_point = ray.origin + dir * t;
                    // Find closest cell center to hit point
                    let mut min_dist = f32::MAX;
                    for cell in &board_data.cells {
                        let d = cell.center.distance_squared(hit_point);
                        if d < min_dist {
                            min_dist = d;
                            closest_id = Some(cell.id);
                        }
                    }
                }
            }

            board_data.hovered_id = closest_id;

            if mouse_button.just_pressed(MouseButton::Right) {
                if let Some(id) = closest_id {
                    // 1. Reset colors of current path/selection
                    for &p_id in &board_data.current_path {
                        if let Some(&entity) = board_data.entity_map.get(&p_id) {
                            if let Ok((mat_handle, cell_comp)) = mesh_query.get(entity) {
                                if let Some(mat) = materials.get_mut(mat_handle) {
                                    mat.base_color = cell_comp.original_color;
                                }
                            }
                        }
                    }
                    if let Some(sid) = board_data.start_id {
                        if let Some(&entity) = board_data.entity_map.get(&sid) {
                            if let Ok((mat_handle, cell_comp)) = mesh_query.get(entity) {
                                if let Some(mat) = materials.get_mut(mat_handle) {
                                    mat.base_color = cell_comp.original_color;
                                }
                            }
                        }
                    }

                    // 2. Logic for Start/End
                    if board_data.start_id.is_none() || (board_data.start_id.is_some() && board_data.end_id.is_some()) {
                        board_data.start_id = Some(id);
                        board_data.end_id = None;
                        board_data.current_path.clear();
                        
                        // Highlight Start
                        if let Some(&entity) = board_data.entity_map.get(&id) {
                            if let Ok((mat_handle, _)) = mesh_query.get(entity) {
                                if let Some(mat) = materials.get_mut(mat_handle) {
                                    mat.base_color = Color::srgb(0.95, 0.61, 0.07); // Orange-ish
                                }
                            }
                        }
                    } else {
                        board_data.end_id = Some(id);
                        let path = find_path(&board_data.neighbors, board_data.start_id.unwrap(), id);
                        board_data.current_path = path.clone();
                        
                        // Highlight Path
                        for &p_id in &path {
                            if let Some(&entity) = board_data.entity_map.get(&p_id) {
                                if let Ok((mat_handle, _)) = mesh_query.get(entity) {
                                    if let Some(mat) = materials.get_mut(mat_handle) {
                                        mat.base_color = Color::srgb(0.95, 0.77, 0.06); // Gold
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

fn update_ui(
    board_data: Res<BoardData>,
    mut hover_query: Query<&mut Text, (With<HoverText>, Without<SelectionText>) >,
    mut selection_query: Query<&mut Text, (With<SelectionText>, Without<HoverText>) >,
) {
    if let Ok(mut hover_text) = hover_query.get_single_mut() {
        if let Some(id) = board_data.hovered_id {
            if let Some(cell) = board_data.cells.get(id) {
                hover_text.0 = format!(
                    "Cell #{}\n{}\n", 
                    id, 
                    if cell.is_land { "🌍 LAND" } else { "🌊 OCEAN" }
                );
            }
        } else {
            hover_text.0 = "Hover to explore...\n".to_string();
        }
    }

    if let Ok(mut sel_text) = selection_query.get_single_mut() {
        sel_text.0 = format!(
            "Start: {}\nEnd: {}\nPath: {} cells",
            board_data.start_id.map(|id| id.to_string()).unwrap_or("---".into()),
            board_data.end_id.map(|id| id.to_string()).unwrap_or("---".into()),
            if !board_data.current_path.is_empty() { board_data.current_path.len().to_string() } else { "---".into() }
        );
    }
}
