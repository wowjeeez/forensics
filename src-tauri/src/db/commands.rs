use crate::db::auxiliary::Group;
use crate::index::{IndexStats, MasterIndexer, Query, QueryResult};
use crate::io::types::FileInfo;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Global database state
pub struct DatabaseState {
    current_db: Arc<RwLock<Option<Arc<MasterIndexer>>>>,
}

impl DatabaseState {
    pub fn new() -> Self {
        Self {
            current_db: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn set_db(&self, db: MasterIndexer) {
        let mut current = self.current_db.write().await;
        *current = Some(Arc::new(db));
    }

    pub async fn get_db(&self) -> Option<Arc<MasterIndexer>> {
        self.current_db.read().await.clone()
    }
}

#[tauri::command]
pub async fn create_project_database(
    evidence_path: String,
    state: State<'_, DatabaseState>,
) -> Result<String, String> {
    let path = PathBuf::from(&evidence_path);

    match MasterIndexer::get_or_init_from_project_path(&path) {
        Ok(db) => {
            state.set_db(db).await;
            Ok(path.to_string_lossy().to_string())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_project_metadata(state: State<'_, DatabaseState>) -> Result<IndexStats, String> {
    let db = state.get_db().await.ok_or("No database open")?;
    db.stats().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn index_directory(
    file_tree: FileInfo,
    state: State<'_, DatabaseState>,
) -> Result<IndexStats, String> {
    let db = state.get_db().await.ok_or("No database open")?;
    let index = db
        .index_directory(file_tree.path.as_path())
        .map_err(|x| x.to_string())?;
    Ok(index)
}

#[tauri::command]
pub async fn search_database(
    query: Query,
    state: State<'_, DatabaseState>,
) -> Result<QueryResult, String> {
    let db = state.get_db().await.ok_or("No database open")?;
    let qp = db.query_planner();
    qp.execute(&query).map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseStats {
    pub db_path: String,
    pub project_path: String,
    pub size_on_disk: u64,
    pub file_count: usize,
    pub indexed: bool,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqliteTableInfo {
    pub name: String,
    pub columns: Vec<SqliteColumnInfo>,
    pub row_count: u64,
    pub indexes: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqliteColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub primary_key: bool,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SqliteDatabaseInfo {
    pub version: String,
    pub page_size: u32,
    pub tables: Vec<SqliteTableInfo>,
    pub total_rows: u64,
}

#[tauri::command]
pub async fn query_sqlite_info(db_path: String) -> Result<SqliteDatabaseInfo, String> {
    use rusqlite::{Connection, OpenFlags};
    use std::path::Path;

    // Validate path exists
    let path = Path::new(&db_path);
    if !path.exists() {
        return Err(format!("Database file does not exist: {}", db_path));
    }

    if !path.is_file() {
        return Err(format!("Path is not a file: {}", db_path));
    }

    // Check file header to ensure it's a SQLite database
    if let Ok(mut file) = std::fs::File::open(path) {
        use std::io::Read;
        let mut header = [0u8; 16];
        if file.read(&mut header).is_ok() {
            let header_str = String::from_utf8_lossy(&header);
            if !header_str.starts_with("SQLite format 3") {
                return Err(format!(
                    "File does not appear to be a valid SQLite database. Header: '{}'",
                    header_str.escape_default()
                ));
            }
        }
    }

    // Try to open with multiple flag combinations
    let conn = Connection::open_with_flags(
        &db_path,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .or_else(|e1| {
        // Try without NO_MUTEX flag (might help with locked files)
        eprintln!("First open attempt failed ({}), trying without NO_MUTEX...", e1);
        Connection::open_with_flags(
            &db_path,
            OpenFlags::SQLITE_OPEN_READ_WRITE,
        )
    })
    .map_err(|e| format!("Failed to open database '{}': {}. File might be locked, corrupted, or not a valid SQLite3 database.", db_path, e))?;

    let version: String = conn
        .query_row("SELECT sqlite_version()", [], |row| row.get(0))
        .unwrap_or_else(|_| "unknown".to_string());

    let page_size: u32 = conn
        .pragma_query_value(None, "page_size", |row| row.get(0))
        .unwrap_or(4096);

    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .map_err(|e| e.to_string())?;

    let table_names: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut tables = Vec::new();
    let mut total_rows = 0u64;

    for table_name in table_names {
        let mut col_stmt = conn
            .prepare(&format!("PRAGMA table_info('{}')", table_name))
            .map_err(|e| e.to_string())?;

        let columns: Vec<SqliteColumnInfo> = col_stmt
            .query_map([], |row| {
                Ok(SqliteColumnInfo {
                    name: row.get(1)?,
                    data_type: row.get(2)?,
                    nullable: row.get::<_, i32>(3)? == 0,
                    primary_key: row.get::<_, i32>(5)? == 1,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        let row_count: i64 = conn
            .query_row(
                &format!("SELECT COUNT(*) FROM '{}'", table_name),
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let mut idx_stmt = conn
            .prepare(&format!("PRAGMA index_list('{}')", table_name))
            .map_err(|e| e.to_string())?;

        let indexes: Vec<String> = idx_stmt
            .query_map([], |row| row.get(1))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        total_rows += row_count as u64;

        tables.push(SqliteTableInfo {
            name: table_name,
            columns,
            row_count: row_count as u64,
            indexes,
        });
    }

    Ok(SqliteDatabaseInfo {
        version,
        page_size,
        tables,
        total_rows,
    })
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryResultRow {
    pub values: Vec<serde_json::Value>,
}

#[tauri::command]
pub async fn query_sqlite_table(
    db_path: String,
    table_name: String,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<QueryResultRow>, String> {
    use rusqlite::{Connection, OpenFlags};

    let conn = Connection::open_with_flags(
        &db_path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|e| format!("Failed to open database: {}", e))?;

    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    let query = format!(
        "SELECT * FROM '{}' LIMIT {} OFFSET {}",
        table_name, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let column_count = stmt.column_count();

    let rows: Vec<QueryResultRow> = stmt
        .query_map([], |row| {
            let mut values = Vec::new();
            for i in 0..column_count {
                // Try different types and convert to JSON value
                let value = if let Ok(s) = row.get::<_, String>(i) {
                    serde_json::Value::String(s)
                } else if let Ok(n) = row.get::<_, i64>(i) {
                    serde_json::Value::Number(n.into())
                } else if let Ok(f) = row.get::<_, f64>(i) {
                    serde_json::json!(f)
                } else if let Ok(b) = row.get::<_, bool>(i) {
                    serde_json::Value::Bool(b)
                } else if let Ok(bytes) = row.get::<_, Vec<u8>>(i) {
                    // Convert bytes to hex string
                    serde_json::Value::String(format!("0x{}", hex::encode(bytes)))
                } else {
                    serde_json::Value::Null
                };
                values.push(value);
            }
            Ok(QueryResultRow { values })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LevelDbInfo {
    pub key_count: u64,
    pub approximate_size: u64,
    pub files: Vec<String>,
}

#[tauri::command]
pub async fn query_leveldb_info(db_path: String) -> Result<LevelDbInfo, String> {
    use std::path::Path;

    let path = Path::new(&db_path);

    if !path.is_dir() {
        return Err("LevelDB path must be a directory".to_string());
    }

    let mut total_size = 0u64;
    let mut files = Vec::new();

    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    total_size += metadata.len();
                    if let Some(name) = entry.file_name().to_str() {
                        files.push(name.to_string());
                    }
                }
            }
        }
    }

    let key_count = total_size / 100;

    Ok(LevelDbInfo {
        key_count,
        approximate_size: total_size,
        files,
    })
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexedDbInfo {
    pub databases: Vec<String>,
    pub total_keys: u64,
    pub subdirectories: Vec<String>,
}

#[tauri::command]
pub async fn query_indexeddb_info(db_path: String) -> Result<IndexedDbInfo, String> {
    use std::path::Path;

    let path = Path::new(&db_path);

    if !path.is_dir() {
        return Err("IndexedDB path must be a directory".to_string());
    }

    let mut databases = Vec::new();
    let mut subdirectories = Vec::new();
    let mut total_keys = 0u64;

    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                if let Some(name) = entry.file_name().to_str() {
                    subdirectories.push(name.to_string());

                    if name.ends_with(".indexeddb") {
                        databases.push(name.replace(".indexeddb", ""));

                        if let Ok(dir_entries) = std::fs::read_dir(&entry_path) {
                            let mut dir_size = 0u64;
                            for file_entry in dir_entries.flatten() {
                                if let Ok(metadata) = file_entry.metadata() {
                                    if metadata.is_file() {
                                        dir_size += metadata.len();
                                    }
                                }
                            }
                            total_keys += dir_size / 100;
                        }
                    }
                }
            }
        }
    }

    if databases.is_empty() {
        databases.push("indexeddb".to_string());
        if let Ok(entries) = std::fs::read_dir(path) {
            let mut total_size = 0u64;
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() {
                        total_size += metadata.len();
                    }
                }
            }
            total_keys = total_size / 100;
        }
    }

    Ok(IndexedDbInfo {
        databases,
        total_keys,
        subdirectories,
    })
}

#[tauri::command]
pub async fn create_group(
    name: String,
    color: String,
    state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let state = state
        .get_db()
        .await
        .ok_or(anyhow::Error::msg("Failed to get db".to_string()))
        .map_err(|y| y.to_string())?;
    let db = state.get_auxiliary_db();
    db.create_group(name, color).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_group(
    name: String,
    color: String,
    state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let state = state
        .get_db()
        .await
        .ok_or(anyhow::Error::msg("Failed to get db".to_string()))
        .map_err(|y| y.to_string())?;
    let db = state.get_auxiliary_db();
    db.delete_group(name, color).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_groups(state: State<'_, DatabaseState>) -> Result<Vec<Group>, String> {
    let state = state
        .get_db()
        .await
        .ok_or(anyhow::Error::msg("Failed to get db".to_string()))
        .map_err(|y| y.to_string())?;
    let db = state.get_auxiliary_db();
    Ok(db.get_groups())
}
