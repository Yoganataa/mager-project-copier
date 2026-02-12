use crate::error::{Error, Result};
use std::collections::HashMap;
use lazy_static::lazy_static;

pub trait Template: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn render(&self, content: &str) -> String;
}

pub struct DefaultTemplate;
impl Template for DefaultTemplate {
    fn name(&self) -> &str { "Default" }
    fn description(&self) -> &str { "Raw project snapshot" }
    fn render(&self, content: &str) -> String {
        content.to_string()
    }
}

pub struct ReviewTemplate;
impl Template for ReviewTemplate {
    fn name(&self) -> &str { "Code Review" }
    fn description(&self) -> &str { "Ask for a comprehensive code review" }
    fn render(&self, content: &str) -> String {
        format!(
            "You are an expert Principal Software Engineer. I have provided the project structure and source code below.\n\
            Your task is to perform a comprehensive Code Review.\n\n\
            # Project Context:\n\
            {}\n\n\
            # Instructions:\n\
            Provide your review in a structured format with priority levels.",
            content
        )
    }
}

pub struct ExplainTemplate;
impl Template for ExplainTemplate {
    fn name(&self) -> &str { "Explain" }
    fn description(&self) -> &str { "Explain the project architecture" }
    fn render(&self, content: &str) -> String {
        format!(
            "You are a Technical Lead onboarding a new developer.\n\
            Read the following project structure and code.\n\n\
            # Project Context:\n\
            {}\n\n\
            # Task:\n\
            Explain the folder structure and how components interact.",
            content
        )
    }
}

lazy_static! {
    pub static ref TEMPLATES: HashMap<String, Box<dyn Template>> = {
        let mut m: HashMap<String, Box<dyn Template>> = HashMap::new();
        m.insert("default".to_string(), Box::new(DefaultTemplate));
        m.insert("review".to_string(), Box::new(ReviewTemplate));
        m.insert("explain".to_string(), Box::new(ExplainTemplate));
        m
    };
}

pub fn get_template(id: &str) -> Result<&Box<dyn Template>> {
    TEMPLATES.get(id).ok_or_else(|| Error::TemplateNotFound(id.to_string()))
}

pub fn list_templates() -> Vec<(&'static String, &'static Box<dyn Template>)> {
    let mut v: Vec<_> = TEMPLATES.iter().collect();
    v.sort_by_key(|(k, _)| *k);
    v
}
