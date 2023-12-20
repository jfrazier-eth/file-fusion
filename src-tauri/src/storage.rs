use directories::UserDirs;

use crate::errors::Error;

pub fn get_home_dir() -> Result<String, Error> {
    let user_dirs = UserDirs::new().ok_or(Error::HomeDirNotFound)?;
    let home_dir = user_dirs.home_dir();
    let home_dir = home_dir
        .as_os_str()
        .to_str()
        .ok_or(Error::HomeDirNotFound)?;
    Ok(String::from(home_dir))
}
