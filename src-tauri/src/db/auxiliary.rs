use std::io::Read;
use std::path::PathBuf;
use image::EncodableLayout;
use sled::IVec;

pub struct AuxiliaryProjectDb {
    db: sled::Db,
}


#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub name: String,
    pub color: String,
    pub content: Vec<(String, String)>,
}


impl AuxiliaryProjectDb {
    pub fn init(path: PathBuf) -> anyhow::Result<Self> {
        let db = sled::open(path)?;
        Ok(AuxiliaryProjectDb {
            db
        })
    }

    pub fn create_group(&self, name: String, color: String) -> anyhow::Result<()> {
        let tree = self.db.open_tree(format!("g-{}-{}", name.replace("-", "#"), color).as_bytes())?;
        tree.flush().expect("failed to write group to disk");
        println!("Group created {name}");
        Ok(())
    }

    pub fn delete_group(&self, name: String, color: String) -> anyhow::Result<()> {
        self.db.drop_tree(format!("g-{}-{}", name.replace("-", "#"), color).as_bytes())?;
        println!("Group dropped {name}");
        Ok(())
    }

    fn get_trees(&self) -> Vec<String> {
        let names = self.db.tree_names();
        let groups = names.iter().map(|x| {
            let mut str = String::new();
            x.as_bytes().read_to_string(&mut str).unwrap();
            str.replace(
                "#",
                "-",
            )
        }).collect::<Vec<String>>();
        groups.iter().filter(|x| x != &&"__sled__default".to_string()).map(|x| x.clone()).collect::<Vec<String>>()
    }

    pub fn get_groups(&self) -> Vec<Group> {
        let mut result = Vec::new();
        for grp in self.get_trees().iter().filter(|x| x.starts_with("g-")) {
            let entries = self.db.open_tree(grp).expect("failed to open tree");
            let parts = grp.split("--").collect::<Vec<&str>>();
            result.push(Group {
                name: parts[0].to_string().replace("g-", ""),
                color: parts[1].to_string(),
                content: entries.iter().values().map(|x| x.unwrap())
                    .map(|x| bincode::deserialize::<(String, String)>(x.as_bytes()).unwrap()).collect(),
            })
        }
        result
    }
}
