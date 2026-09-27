/// GitHub heading slug algorithm:
/// lowercase, spaces → `-`, strip non-alphanumeric/space/hyphen, deduplicate with `-N`
pub fn slugify(text: &str) -> String {
    text.chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == ' ' || *c == '-')
        .map(|c| {
            if c == ' ' {
                '-'
            } else {
                c.to_ascii_lowercase()
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

pub struct SlugCounter {
    counts: std::collections::HashMap<String, usize>,
}

impl Default for SlugCounter {
    fn default() -> Self {
        Self::new()
    }
}

impl SlugCounter {
    pub fn new() -> Self {
        Self {
            counts: Default::default(),
        }
    }

    pub fn next(&mut self, text: &str) -> String {
        let base = slugify(text);
        let count = self.counts.entry(base.clone()).or_insert(0);
        let slug = if *count == 0 {
            base.clone()
        } else {
            format!("{}-{}", base, count)
        };
        *count += 1;
        slug
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_slug() {
        assert_eq!(slugify("Hello World"), "hello-world");
        assert_eq!(slugify("Getting Started!"), "getting-started");
        assert_eq!(slugify("C++ Notes"), "c-notes");
    }

    #[test]
    fn duplicate_slugs() {
        let mut c = SlugCounter::new();
        assert_eq!(c.next("Foo"), "foo");
        assert_eq!(c.next("Foo"), "foo-1");
        assert_eq!(c.next("Foo"), "foo-2");
    }

    #[test]
    fn unicode_slug() {
        assert_eq!(slugify("Héllo Wörld"), "hllo-wrld"); // non-ASCII stripped
    }
}
