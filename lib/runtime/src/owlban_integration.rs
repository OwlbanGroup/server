// SPDX-License-Identifier: Apache-2.0
// Integration module for OWLban group data into Dynamo runtime

use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};

#[derive(Debug, Serialize, Deserialize)]
pub struct OwlbanRevenue {
    pub amount: String,
    pub routing_number: String,
    pub account_number: String,
    pub bank_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OwlbanBanking {
    pub routing_numbers: std::collections::HashMap<String, String>,
    pub account_numbers: std::collections::HashMap<String, String>,
}

pub struct OwlbanData {
    revenue: Option<OwlbanRevenue>,
    banking: Option<OwlbanBanking>,
}

impl OwlbanData {
    pub fn new(data_dir: &str) -> Result<Self> {
        let revenue_path = Path::new(data_dir).join("owlban_group_revenue.json");
        let banking_path = Path::new(data_dir).join("owlban_group_banking.json");

        let revenue = if revenue_path.exists() {
            let content = fs::read_to_string(&revenue_path)
                .with_context(|| format!("Failed to read {:?}", revenue_path))?;
            Some(serde_json::from_str(&content)
                .with_context(|| format!("Failed to parse {:?}", revenue_path))?)
        } else {
            None
        };

        let banking = if banking_path.exists() {
            let content = fs::read_to_string(&banking_path)
                .with_context(|| format!("Failed to read {:?}", banking_path))?;
            Some(serde_json::from_str(&content)
                .with_context(|| format!("Failed to parse {:?}", banking_path))?)
        } else {
            None
        };

        Ok(Self { revenue, banking })
    }

    pub fn get_revenue(&self) -> Option<&OwlbanRevenue> {
        self.revenue.as_ref()
    }

    pub fn get_banking(&self) -> Option<&OwlbanBanking> {
        self.banking.as_ref()
    }
}

// Further integration with runtime services and APIs can be added here.
