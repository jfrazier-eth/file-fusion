use std::collections::HashSet;

use object_store::path::Path;

pub fn dedup_paths(paths: &Vec<Path>) -> HashSet<Path> {
    let mut deduped_paths = HashSet::<Path>::new();
    for path in paths.iter() {
        let mut is_valid = true;
        for item in deduped_paths.clone().into_iter() {
            let item_includes_path = path.prefix_matches(&item);
            if item_includes_path {
                is_valid = false;
                break;
            }

            let path_includes_item = item.prefix_matches(path);
            if path_includes_item {
                deduped_paths.remove(&item);
            }
        }

        if is_valid {
            deduped_paths.insert(path.clone());
        }
    }

    deduped_paths
}

#[cfg(test)]
mod test_dedup_paths {
    use super::*;

    #[test]
    fn test_filter_subfiles() {
        // descending
        let paths = vec![
            Path::parse("dir1/subdir1").unwrap(),
            Path::parse("dir1/subdir1/file1").unwrap(),
        ];
        let deduped_paths = dedup_paths(&paths);

        assert_eq!(deduped_paths.len(), 1);
        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir1").unwrap())
                .is_some(),
            true
        );

        // ascending
        let paths = vec![
            Path::parse("dir1/subdir1/file1").unwrap(),
            Path::parse("dir1/subdir1").unwrap(),
        ];
        let deduped_paths = dedup_paths(&paths);

        assert_eq!(deduped_paths.len(), 1);
        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir1").unwrap())
                .is_some(),
            true
        );
    }

    #[test]
    fn test_filter_deep_subfiles() {
        // descending
        let paths = vec![
            Path::parse("dir1/subdir1").unwrap(),
            Path::parse("dir1/subdir1/subdir2/subdir3/file1").unwrap(),
        ];
        let deduped_paths = dedup_paths(&paths);

        assert_eq!(deduped_paths.len(), 1);
        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir1").unwrap())
                .is_some(),
            true
        );

        // ascending
        let paths = vec![
            Path::parse("dir1/subdir1/subdir2/subdir3/file1").unwrap(),
            Path::parse("dir1/subdir1").unwrap(),
        ];
        let deduped_paths = dedup_paths(&paths);

        assert_eq!(deduped_paths.len(), 1);
        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir1").unwrap())
                .is_some(),
            true
        );
    }

    #[test]
    fn test_includes_siblings() {
        let paths = vec![
            Path::parse("dir1/subdir1").unwrap(),
            Path::parse("dir1/subdir2").unwrap(),
            Path::parse("dir2/subdir3").unwrap(),
        ];

        let deduped_paths = dedup_paths(&paths);

        assert_eq!(deduped_paths.len(), 3);
        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir1").unwrap())
                .is_some(),
            true
        );

        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir2").unwrap())
                .is_some(),
            true
        );

        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir2").unwrap())
                .is_some(),
            true
        );
    }

    #[test]
    fn trailing_delimiter_is_ignored() {
        let paths = vec![
            Path::parse("dir1/subdir1").unwrap(),
            Path::parse("dir1/subdir1/").unwrap(),
        ];

        let deduped_paths = dedup_paths(&paths);
        assert_eq!(deduped_paths.len(), 1);
        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir1").unwrap())
                .is_some(),
            true
        );
    }

    #[test]
    fn leading_delimiter_is_ignored() {
        let paths = vec![
            Path::parse("/dir1/subdir1").unwrap(),
            Path::parse("dir1/subdir1").unwrap(),
        ];

        let deduped_paths = dedup_paths(&paths);
        assert_eq!(deduped_paths.len(), 1);
        assert_eq!(
            deduped_paths
                .get(&Path::parse("dir1/subdir1").unwrap())
                .is_some(),
            true
        );
    }

    #[test]
    fn root_contains_all() {
        let paths = vec![
            Path::parse("/").unwrap(),
            Path::parse("dir1/subdir1").unwrap(),
            Path::parse("dir2/subdir2/file1").unwrap(),
            Path::parse("dir3").unwrap(),
        ];

        let deduped_paths = dedup_paths(&paths);
        assert_eq!(deduped_paths.len(), 1);
        assert_eq!(
            deduped_paths.get(&Path::parse("/").unwrap()).is_some(),
            true
        );
    }
}
