mod io;
mod db;
mod index;

use io::commands::FileSystemState;
use db::DatabaseState;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(FileSystemState::new())
        .manage(DatabaseState::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            // File system commands
            io::commands::read_file,
            io::commands::read_file_as_string,
            io::commands::write_file,
            io::commands::exists,
            io::commands::is_file,
            io::commands::is_dir,
            io::commands::get_metadata,
            io::commands::list_directory,
            io::commands::scan_directory,
            io::commands::delete_file,
            io::commands::delete_directory,
            io::commands::create_directory,
            io::commands::copy_file,
            io::commands::move_path,
            io::commands::calculate_hash,
            io::commands::search_files,
            io::commands::search_content,
            io::commands::read_file_chunked,
            io::commands::get_file_size,
            // Database commands
            db::commands::create_project_database,
            db::commands::get_project_metadata,
            db::commands::index_directory,
            db::commands::search_database,
            db::commands::query_sqlite_info,
            db::commands::query_sqlite_table,
            db::commands::query_leveldb_info,
            db::commands::query_indexeddb_info,
           // db::commands::store_file_note,
           // db::commands::add_file_tag,
           // db::commands::get_all_tags,
           // db::commands::get_database_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
