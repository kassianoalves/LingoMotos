use crate::error::{AppError, AppResult};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static ID_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreSettingsDto {
    pub name: String,
    pub document_number: String,
    pub phone: String,
    pub whatsapp: String,
    pub email: String,
    pub address: String,
    pub logo_path: String,
    pub theme: String,
    pub pix_key: String,
    pub pix_receiver_name: String,
    pub pix_receiver_city: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomerDto {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub whatsapp: String,
    pub motorcycle_model: String,
    pub document_number: String,
    pub email: String,
    pub address: String,
    pub notes: String,
    pub active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomerInput {
    pub id: Option<String>,
    pub name: String,
    pub phone: String,
    pub whatsapp: String,
    pub motorcycle_model: String,
    pub document_number: String,
    pub email: String,
    pub address: String,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDto {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierDto {
    pub id: String,
    pub name: String,
    pub document_number: Option<String>,
    pub phone: Option<String>,
    pub whatsapp: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductDto {
    pub id: String,
    pub sku: String,
    pub barcode: Option<String>,
    pub name: String,
    pub category_id: String,
    pub category_name: String,
    pub supplier_id: Option<String>,
    pub supplier_name: Option<String>,
    pub brand: Option<String>,
    pub motorcycle_application: Option<String>,
    pub location: Option<String>,
    pub notes: Option<String>,
    pub unit: String,
    pub cost_price_cents: i64,
    pub sale_price_cents: i64,
    pub margin_percent: f64,
    pub min_stock_quantity: f64,
    pub current_stock_quantity: f64,
    pub sold_last_30_days: f64,
    pub last_movement_at: Option<String>,
    pub status: String,
    pub deleted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub custom_fields: Vec<ProductCustomFieldDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductCustomFieldDto {
    pub id: String,
    pub product_id: String,
    pub field_key: String,
    pub field_label: String,
    pub field_type: String,
    pub field_value: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductInput {
    pub sku: String,
    pub barcode: String,
    pub name: String,
    pub category_id: String,
    pub supplier_id: String,
    pub brand: String,
    pub motorcycle_application: String,
    pub location: String,
    pub notes: String,
    pub unit: String,
    pub cost_price_cents: i64,
    pub sale_price_cents: i64,
    pub min_stock_quantity: i64,
    pub current_stock_quantity: i64,
    pub custom_fields: Vec<ProductCustomFieldInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductCustomFieldInput {
    pub field_key: String,
    pub field_label: String,
    pub field_type: String,
    pub field_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImportOptionsDto {
    pub duplicate_strategy: String,
    pub allow_partial_import: bool,
    pub rollback_on_error: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImportValuesDto {
    pub sku: String,
    pub barcode: String,
    pub name: String,
    pub category_id: String,
    pub category_name: String,
    pub supplier_id: String,
    pub supplier_name: String,
    pub brand: String,
    pub motorcycle_application: String,
    pub location: String,
    pub notes: String,
    pub unit: String,
    pub cost_price_cents: i64,
    pub sale_price_cents: i64,
    pub min_stock_quantity: i64,
    pub current_stock_quantity: i64,
    pub custom_fields: Vec<ProductCustomFieldInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImportDraftDto {
    pub row_number: i64,
    pub raw: Value,
    pub values: ProductImportValuesDto,
    pub action: String,
    pub duplicate_product_id: Option<String>,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImportPreviewDto {
    pub file_name: String,
    pub total_rows: i64,
    pub valid_rows: i64,
    pub create_count: i64,
    pub update_count: i64,
    pub skip_count: i64,
    pub error_count: i64,
    pub drafts: Vec<ProductImportDraftDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImportRequestDto {
    pub batch_name: String,
    pub source: ProductImportPreviewDto,
    pub options: ProductImportOptionsDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImportErrorDto {
    pub row_number: i64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductImportReportDto {
    pub batch_id: String,
    pub imported: i64,
    pub updated: i64,
    pub skipped: i64,
    pub failed: i64,
    pub custom_fields_saved: i64,
    pub rolled_back: bool,
    pub errors: Vec<ProductImportErrorDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StockMovementInput {
    pub product_id: String,
    pub movement_type: String,
    pub direction: String,
    pub quantity: i64,
    pub reason: String,
    pub reference_id: String,
    pub unit_cost_cents: i64,
    pub unit_price_cents: i64,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StockMovementDto {
    pub id: String,
    pub product_id: String,
    pub movement_type: String,
    pub direction: String,
    pub quantity: i64,
    pub reason: String,
    pub reference_id: String,
    pub unit_cost_cents: i64,
    pub unit_price_cents: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashSessionDto {
    pub id: String,
    pub opened_at: String,
    pub closed_at: Option<String>,
    pub opening_amount_cents: i64,
    pub expected_amount_cents: i64,
    pub reported_amount_cents: Option<i64>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleItemInput {
    pub product_id: String,
    pub quantity: f64,
    pub unit_cost_cents: i64,
    pub unit_price_cents: i64,
    pub discount_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentInput {
    pub method: String,
    pub amount_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSaleInput {
    pub customer_id: Option<String>,
    pub discount_type: Option<String>,
    pub discount_amount: Option<f64>,
    pub items: Vec<SaleItemInput>,
    pub payments: Vec<PaymentInput>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleResultDto {
    pub sale_number: String,
    pub total_cents: i64,
    pub gross_profit_cents: i64,
    pub margin_percent: f64,
    pub stock_movements: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleRecordDto {
    pub id: String,
    pub sale_number: String,
    pub sold_at: String,
    pub customer_name: String,
    pub items_count: i64,
    pub payment_method: String,
    pub total_cents: i64,
    pub cost_cents: i64,
    pub discount_cents: i64,
    pub fee_cents: i64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinancialGoalDto {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub target_amount_cents: i64,
    pub start_date: String,
    pub end_date: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CashMovementDto {
    pub id: String,
    pub occurred_at: String,
    pub description: String,
    pub movement_type: String,
    pub source: String,
    pub direction: String,
    pub amount_cents: i64,
    pub payment_method: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FinancialTransactionDto {
    pub id: String,
    pub occurred_at: String,
    pub description: String,
    pub transaction_type: String,
    pub amount_cents: i64,
    pub status: String,
    pub payment_method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PayableInput {
    pub id: Option<String>,
    pub description: String,
    pub category_type: String,
    pub amount_cents: i64,
    pub due_date: String,
    pub company_or_supplier: String,
    pub recurrence_type: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PayableDto {
    pub id: String,
    pub description: String,
    pub category_type: String,
    pub amount_cents: i64,
    pub due_date: String,
    pub company_or_supplier: String,
    pub recurrence_type: String,
    pub status: String,
    pub paid_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceivableInput {
    pub id: Option<String>,
    pub description: String,
    pub customer: String,
    pub amount_cents: i64,
    pub due_date: String,
    pub recurrence_type: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceivableDto {
    pub id: String,
    pub description: String,
    pub customer: String,
    pub amount_cents: i64,
    pub due_date: String,
    pub recurrence_type: String,
    pub status: String,
    pub received_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FinancialSummaryDto {
    pub revenue_total_cents: i64,
    pub revenue_today_cents: i64,
    pub revenue_month_cents: i64,
    pub expenses_total_cents: i64,
    pub gross_profit_cents: i64,
    pub estimated_net_profit_cents: i64,
    pub average_margin_percent: f64,
    pub average_ticket_cents: i64,
    pub sales_count: i64,
    pub cost_of_goods_sold_cents: i64,
    pub cash_total_cents: i64,
    pub sales_by_period: Vec<DailyTotalDto>,
    pub expenses_by_period: Vec<DailyTotalDto>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyTotalDto {
    pub date: String,
    pub amount_cents: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopSellingCategoryDto {
    pub category_id: Option<String>,
    pub category_name: String,
    pub quantity_sold: f64,
    pub revenue_total_cents: i64,
    pub gross_profit_cents: i64,
    pub percentage: f64,
}

pub struct CommerceRepository<'a> {
    connection: &'a mut Connection,
}

impl<'a> CommerceRepository<'a> {
    pub fn new(connection: &'a mut Connection) -> Self {
        Self { connection }
    }

    pub fn get_store_settings(&self) -> AppResult<StoreSettingsDto> {
        Ok(StoreSettingsDto {
            name: self.setting("store.name")?.unwrap_or_else(|| "LingoMotos".into()),
            document_number: self.setting("store.document_number")?.unwrap_or_default(),
            phone: self.setting("store.phone")?.unwrap_or_default(),
            whatsapp: self.setting("store.whatsapp")?.unwrap_or_default(),
            email: self.setting("store.email")?.unwrap_or_default(),
            address: self.setting("store.address")?.unwrap_or_default(),
            logo_path: self.setting("store.logo_path")?.unwrap_or_default(),
            theme: self.setting("store.theme")?.unwrap_or_else(|| "light".into()),
            pix_key: self.setting("store.pix_key")?.unwrap_or_default(),
            pix_receiver_name: self.setting("store.pix_receiver_name")?.unwrap_or_default(),
            pix_receiver_city: self.setting("store.pix_receiver_city")?.unwrap_or_default(),
        })
    }

    pub fn update_store_settings(&self, input: &StoreSettingsDto) -> AppResult<StoreSettingsDto> {
        for (key, value) in [
            ("store.name", input.name.as_str()),
            ("store.document_number", input.document_number.as_str()),
            ("store.phone", input.phone.as_str()),
            ("store.whatsapp", input.whatsapp.as_str()),
            ("store.email", input.email.as_str()),
            ("store.address", input.address.as_str()),
            ("store.logo_path", input.logo_path.as_str()),
            ("store.theme", input.theme.as_str()),
            ("store.pix_key", input.pix_key.as_str()),
            ("store.pix_receiver_name", input.pix_receiver_name.as_str()),
            ("store.pix_receiver_city", input.pix_receiver_city.as_str()),
        ] {
            self.connection.execute(
                "INSERT INTO settings (key, value, group_name) VALUES (?1, ?2, 'store')
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                params![key, value],
            )?;
        }
        self.get_store_settings()
    }

    fn setting(&self, key: &str) -> AppResult<Option<String>> {
        Ok(self.connection.query_row("SELECT value FROM settings WHERE key = ?1", [key], |row| row.get(0)).optional()?)
    }

    pub fn list_customers(&self) -> AppResult<Vec<CustomerDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, COALESCE(phone,''), COALESCE(mobile_phone,''), COALESCE(motorcycle_model,''), COALESCE(document_number,''),
                    COALESCE(email,''), COALESCE(address_line,''), COALESCE(notes,''), is_active, created_at, updated_at
             FROM customers WHERE deleted_at IS NULL ORDER BY name",
        )?;
        let rows = stmt.query_map([], map_customer)?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn get_customer(&self, id: &str) -> AppResult<Option<CustomerDto>> {
        Ok(self.connection.query_row(
            "SELECT id, name, COALESCE(phone,''), COALESCE(mobile_phone,''), COALESCE(motorcycle_model,''), COALESCE(document_number,''),
                    COALESCE(email,''), COALESCE(address_line,''), COALESCE(notes,''), is_active, created_at, updated_at
             FROM customers WHERE id = ?1 AND deleted_at IS NULL",
            [id],
            map_customer,
        ).optional()?)
    }

    pub fn save_customer(&self, input: &CustomerInput) -> AppResult<CustomerDto> {
        let id = input.id.clone().filter(|value| !value.is_empty()).unwrap_or_else(new_id);
        self.connection.execute(
            "INSERT INTO customers (id, name, phone, mobile_phone, motorcycle_model, document_number, email, address_line, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, phone = excluded.phone, mobile_phone = excluded.mobile_phone,
               motorcycle_model = excluded.motorcycle_model, document_number = excluded.document_number, email = excluded.email, address_line = excluded.address_line,
               notes = excluded.notes, is_active = 1, deleted_at = NULL",
            params![id, input.name, input.phone, input.whatsapp, input.motorcycle_model, input.document_number, input.email, input.address, input.notes],
        )?;
        self.get_customer(&id)?.ok_or_else(|| AppError::Validation("Cliente nao encontrado apos salvar.".into()))
    }

    pub fn deactivate_customer(&self, id: &str) -> AppResult<()> {
        self.connection.execute("UPDATE customers SET is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn list_product_categories(&self) -> AppResult<Vec<CategoryDto>> {
        let mut stmt = self.connection.prepare("SELECT id, name, description, parent_id, is_active, created_at, updated_at FROM categories WHERE deleted_at IS NULL AND is_active = 1 ORDER BY name")?;
        let rows = stmt.query_map([], |row| Ok(CategoryDto {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            parent_id: row.get(3)?,
            is_active: row.get::<_, i64>(4)? == 1,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn create_product_category(&self, name: &str, description: &str) -> AppResult<CategoryDto> {
        if name.trim().is_empty() {
            return Err(AppError::Validation("Nome da categoria e obrigatorio.".into()));
        }
        let duplicate: bool = self.connection.query_row(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE lower(name) = lower(?1) AND is_active = 1 AND deleted_at IS NULL)",
            [name],
            |row| row.get(0),
        )?;
        if duplicate {
            return Err(AppError::Validation("Ja existe uma categoria ativa com esse nome.".into()));
        }
        let id = new_id();
        self.connection.execute(
            "INSERT INTO categories (id, name, slug, description, is_active) VALUES (?1, ?2, ?3, ?4, 1)",
            params![id, name, slugify(name), description],
        )?;
        self.list_product_categories()?
            .into_iter()
            .find(|category| category.id == id)
            .ok_or_else(|| AppError::Validation("Categoria nao encontrada apos salvar.".into()))
    }

    pub fn update_product_category(&self, id: &str, name: &str, description: &str) -> AppResult<CategoryDto> {
        if name.trim().is_empty() {
            return Err(AppError::Validation("Nome da categoria e obrigatorio.".into()));
        }
        let duplicate: bool = self.connection.query_row(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE lower(name) = lower(?1) AND id <> ?2 AND is_active = 1 AND deleted_at IS NULL)",
            params![name, id],
            |row| row.get(0),
        )?;
        if duplicate {
            return Err(AppError::Validation("Ja existe uma categoria ativa com esse nome.".into()));
        }
        self.connection.execute(
            "UPDATE categories SET name = ?2, slug = ?3, description = ?4 WHERE id = ?1 AND deleted_at IS NULL",
            params![id, name, slugify(name), description],
        )?;
        self.list_product_categories()?
            .into_iter()
            .find(|category| category.id == id)
            .ok_or_else(|| AppError::Validation("Categoria nao encontrada.".into()))
    }

    pub fn deactivate_product_category(&self, id: &str) -> AppResult<()> {
        self.connection.execute(
            "UPDATE categories SET is_active = 0 WHERE id = ?1 AND deleted_at IS NULL",
            [id],
        )?;
        Ok(())
    }

    pub fn list_suppliers(&self) -> AppResult<Vec<SupplierDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, document_number, phone, mobile_phone, email, address_line, notes, is_active, created_at, updated_at
             FROM suppliers WHERE deleted_at IS NULL AND is_active = 1 ORDER BY name",
        )?;
        let rows = stmt.query_map([], |row| Ok(SupplierDto {
            id: row.get(0)?,
            name: row.get(1)?,
            document_number: row.get(2)?,
            phone: row.get(3)?,
            whatsapp: row.get(4)?,
            email: row.get(5)?,
            address: row.get(6)?,
            notes: row.get(7)?,
            is_active: row.get::<_, i64>(8)? == 1,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn create_supplier(&self, input: &SupplierDto) -> AppResult<SupplierDto> {
        if input.name.trim().is_empty() {
            return Err(AppError::Validation("Nome do fornecedor e obrigatorio.".into()));
        }
        let id = new_id();
        self.connection.execute(
            "INSERT INTO suppliers (id, name, document_number, phone, mobile_phone, email, address_line, notes, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, input.name, input.document_number, input.phone, input.whatsapp, input.email, input.address, input.notes, input.is_active as i64],
        )?;
        self.list_suppliers()?
            .into_iter()
            .find(|supplier| supplier.id == id)
            .ok_or_else(|| AppError::Validation("Fornecedor nao encontrado apos salvar.".into()))
    }

    pub fn update_supplier(&self, input: &SupplierDto) -> AppResult<SupplierDto> {
        if input.name.trim().is_empty() {
            return Err(AppError::Validation("Nome do fornecedor e obrigatorio.".into()));
        }
        self.connection.execute(
            "UPDATE suppliers
             SET name = ?2, document_number = ?3, phone = ?4, mobile_phone = ?5, email = ?6,
                 address_line = ?7, notes = ?8, is_active = ?9
             WHERE id = ?1 AND deleted_at IS NULL",
            params![input.id, input.name, input.document_number, input.phone, input.whatsapp, input.email, input.address, input.notes, input.is_active as i64],
        )?;
        self.list_suppliers()?
            .into_iter()
            .find(|supplier| supplier.id == input.id)
            .ok_or_else(|| AppError::Validation("Fornecedor nao encontrado.".into()))
    }

    pub fn deactivate_supplier(&self, id: &str) -> AppResult<()> {
        self.connection.execute(
            "UPDATE suppliers SET is_active = 0 WHERE id = ?1 AND deleted_at IS NULL",
            [id],
        )?;
        Ok(())
    }

    pub fn list_financial_goals(&self) -> AppResult<Vec<FinancialGoalDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, type, target_amount, start_date, end_date, is_active, created_at, updated_at
             FROM financial_goals ORDER BY updated_at DESC, created_at DESC",
        )?;
        let rows = stmt.query_map([], |row| Ok(FinancialGoalDto {
            id: row.get(0)?,
            name: row.get(1)?,
            r#type: row.get(2)?,
            target_amount_cents: row.get(3)?,
            start_date: row.get(4)?,
            end_date: row.get(5)?,
            is_active: row.get::<_, i64>(6)? == 1,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn save_financial_goal(&self, input: &FinancialGoalDto) -> AppResult<FinancialGoalDto> {
        if input.name.trim().is_empty() {
            return Err(AppError::Validation("Nome da meta e obrigatorio.".into()));
        }
        if !matches!(input.r#type.as_str(), "weekly" | "monthly") {
            return Err(AppError::Validation("Tipo de meta invalido.".into()));
        }
        let id = if input.id.trim().is_empty() { new_id() } else { input.id.clone() };
        self.connection.execute(
            "INSERT INTO financial_goals (id, name, type, target_amount, start_date, end_date, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               type = excluded.type,
               target_amount = excluded.target_amount,
               start_date = excluded.start_date,
               end_date = excluded.end_date,
               is_active = excluded.is_active,
               updated_at = CURRENT_TIMESTAMP",
            params![
                id,
                input.name,
                input.r#type,
                input.target_amount_cents,
                input.start_date,
                input.end_date,
                input.is_active as i64
            ],
        )?;
        self.list_financial_goals()?
            .into_iter()
            .find(|goal| goal.id == id)
            .ok_or_else(|| AppError::Validation("Meta nao encontrada apos salvar.".into()))
    }

    pub fn list_products(&self) -> AppResult<Vec<ProductDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT p.id, COALESCE(p.sku,''), p.barcode, p.name, COALESCE(p.category_id,''), COALESCE(c.name,'Sem categoria'),
                    p.preferred_supplier_id, s.name, p.brand, p.motorcycle_application, p.location, p.notes, p.unit, p.cost_price_cents, p.sale_price_cents, p.margin_percent,
                    p.min_stock_quantity, p.current_stock_quantity, 0,
                    (SELECT MAX(occurred_at) FROM stock_movements sm WHERE sm.product_id = p.id AND sm.deleted_at IS NULL),
                    CASE WHEN p.is_active = 1 THEN 'active' ELSE 'inactive' END, p.deleted_at, p.created_at, p.updated_at
             FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN suppliers s ON s.id = p.preferred_supplier_id
             WHERE p.deleted_at IS NULL ORDER BY p.name",
        )?;
        let mut rows = stmt.query_map([], map_product)?.collect::<Result<Vec<_>, _>>()?;
        for product in &mut rows {
            product.custom_fields = self.list_product_custom_fields(&product.id)?;
        }
        Ok(rows)
    }

    pub fn get_product(&self, id: &str) -> AppResult<Option<ProductDto>> {
        Ok(self.list_products()?.into_iter().find(|product| product.id == id))
    }

    pub fn generate_product_sku(
        &self,
        category_id: Option<&str>,
        brand: Option<&str>,
        product_name: &str,
        motorcycle_application: Option<&str>,
    ) -> AppResult<String> {
        if product_name.trim().is_empty() {
            return Err(AppError::Validation("Nome do produto e obrigatorio.".into()));
        }

        let category_name = category_id
            .filter(|value| !value.trim().is_empty())
            .and_then(|value| {
                self.connection
                    .query_row(
                        "SELECT name FROM categories WHERE id = ?1 AND deleted_at IS NULL LIMIT 1",
                        [value],
                        |row| row.get::<_, String>(0),
                    )
                    .optional()
                    .ok()
                    .flatten()
            })
            .unwrap_or_else(|| "GERAL".into());
        let base = build_sku_base(
            &category_name,
            brand.unwrap_or_default(),
            product_name,
            motorcycle_application.unwrap_or_default(),
        );

        for sequence in 1..=9999 {
            let candidate = format!("{base}-{sequence:04}");
            let exists: bool = self.connection.query_row(
                "SELECT EXISTS(
                    SELECT 1 FROM products
                    WHERE lower(trim(sku)) = lower(trim(?1))
                      AND deleted_at IS NULL
                )",
                [candidate.as_str()],
                |row| row.get(0),
            )?;
            if !exists {
                return Ok(candidate);
            }
        }

        Err(AppError::Validation("Nao foi possivel gerar codigo interno disponivel.".into()))
    }

    pub fn create_product(&self, input: &ProductInput) -> AppResult<ProductDto> {
        self.save_product(input, None)
    }

    pub fn update_product(&self, id: &str, input: &ProductInput) -> AppResult<ProductDto> {
        self.save_product(input, Some(id))
    }

    pub fn import_products(&mut self, request: &ProductImportRequestDto) -> AppResult<ProductImportReportDto> {
        if !matches!(request.options.duplicate_strategy.as_str(), "skip" | "update_existing" | "create_new" | "update_prices" | "update_all") {
            return Err(AppError::Validation("Estrategia de duplicidade invalida.".into()));
        }

        let batch_id = new_id();
        let errors = collect_import_errors(request);
        if request.options.rollback_on_error && !errors.is_empty() {
            return Ok(ProductImportReportDto {
                batch_id,
                imported: 0,
                updated: 0,
                skipped: 0,
                failed: errors.len() as i64,
                custom_fields_saved: 0,
                rolled_back: true,
                errors,
            });
        }

        let tx = self.connection.transaction()?;
        tx.execute(
            "INSERT INTO product_import_batches (
                id, file_name, source_type, duplicate_strategy, allow_partial_import, rollback_on_error, total_rows
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                batch_id,
                request.source.file_name,
                source_type_from_file_name(&request.source.file_name),
                request.options.duplicate_strategy,
                request.options.allow_partial_import as i64,
                request.options.rollback_on_error as i64,
                request.source.total_rows,
            ],
        )?;

        let mut imported = 0;
        let mut updated = 0;
        let mut skipped = 0;
        let mut failed = 0;
        let mut custom_fields_saved = 0;

        for draft in &request.source.drafts {
            if draft_has_import_error(draft) {
                failed += 1;
                insert_import_row(&tx, &batch_id, draft, "error", None)?;
                continue;
            }

            let existing_id = if request.options.duplicate_strategy == "create_new" {
                None
            } else {
                find_existing_product_id(&tx, &draft.values)?
            };
            if existing_id.is_some() && request.options.duplicate_strategy == "skip" {
                skipped += 1;
                insert_import_row(&tx, &batch_id, draft, "skip", existing_id.as_deref())?;
                continue;
            }

            let category_id = ensure_import_category(&tx, &draft.values.category_id, &draft.values.category_name)?;
            let supplier_id = ensure_import_supplier(&tx, &draft.values.supplier_id, &draft.values.supplier_name)?;
            let product_id = existing_id.clone().unwrap_or_else(new_id);
            let margin_percent = if draft.values.sale_price_cents > 0 {
                (draft.values.sale_price_cents - draft.values.cost_price_cents) as f64 / draft.values.sale_price_cents as f64 * 100.0
            } else {
                0.0
            };

            tx.execute(
                "INSERT INTO products (
                    id, category_id, preferred_supplier_id, sku, barcode, name, brand, motorcycle_application,
                    notes, unit, cost_price_cents, sale_price_cents, margin_percent, min_stock_quantity,
                    current_stock_quantity, location
                 ) VALUES (?1, NULLIF(?2,''), NULLIF(?3,''), ?4, NULLIF(?5,''), ?6, NULLIF(?7,''), NULLIF(?8,''),
                    NULLIF(?9,''), ?10, ?11, ?12, ?13, ?14, ?15, NULLIF(?16,''))
                 ON CONFLICT(id) DO UPDATE SET
                    category_id = CASE WHEN ?17 = 'update_prices' THEN products.category_id ELSE excluded.category_id END,
                    preferred_supplier_id = CASE WHEN ?17 = 'update_prices' THEN products.preferred_supplier_id ELSE excluded.preferred_supplier_id END,
                    sku = excluded.sku,
                    barcode = CASE WHEN ?17 = 'update_prices' THEN products.barcode ELSE excluded.barcode END,
                    name = CASE WHEN ?17 = 'update_prices' THEN products.name ELSE excluded.name END,
                    brand = CASE WHEN ?17 = 'update_prices' THEN products.brand ELSE excluded.brand END,
                    motorcycle_application = CASE WHEN ?17 = 'update_prices' THEN products.motorcycle_application ELSE excluded.motorcycle_application END,
                    notes = CASE WHEN ?17 = 'update_prices' THEN products.notes ELSE excluded.notes END,
                    unit = CASE WHEN ?17 = 'update_prices' THEN products.unit ELSE excluded.unit END,
                    cost_price_cents = excluded.cost_price_cents,
                    sale_price_cents = excluded.sale_price_cents,
                    margin_percent = excluded.margin_percent,
                    min_stock_quantity = CASE WHEN ?17 = 'update_prices' THEN products.min_stock_quantity ELSE excluded.min_stock_quantity END,
                    current_stock_quantity = CASE WHEN ?17 = 'update_prices' THEN products.current_stock_quantity ELSE excluded.current_stock_quantity END,
                    location = CASE WHEN ?17 = 'update_prices' THEN products.location ELSE excluded.location END,
                    is_active = 1,
                    deleted_at = NULL",
                params![
                    product_id,
                    category_id,
                    supplier_id,
                    draft.values.sku,
                    draft.values.barcode,
                    draft.values.name,
                    draft.values.brand,
                    draft.values.motorcycle_application,
                    draft.values.notes,
                    if draft.values.unit.trim().is_empty() { "un" } else { draft.values.unit.as_str() },
                    draft.values.cost_price_cents,
                    draft.values.sale_price_cents,
                    margin_percent,
                    draft.values.min_stock_quantity,
                    draft.values.current_stock_quantity,
                    draft.values.location,
                    request.options.duplicate_strategy,
                ],
            )?;

            custom_fields_saved += save_custom_fields(&tx, &product_id, &draft.values.custom_fields)?;

            if existing_id.is_some() {
                updated += 1;
                insert_import_row(&tx, &batch_id, draft, "update", Some(product_id.as_str()))?;
            } else {
                imported += 1;
                insert_import_row(&tx, &batch_id, draft, "create", Some(product_id.as_str()))?;
            }
        }

        if !request.options.allow_partial_import && failed > 0 {
            return Ok(ProductImportReportDto {
                batch_id,
                imported: 0,
                updated: 0,
                skipped: 0,
                failed,
                custom_fields_saved: 0,
                rolled_back: true,
                errors,
            });
        }

        tx.execute(
            "UPDATE product_import_batches
             SET created_count = ?2, updated_count = ?3, skipped_count = ?4, failed_count = ?5,
                 status = CASE WHEN ?5 > 0 THEN 'completed_with_errors' ELSE 'completed' END,
                 report_json = ?6, finished_at = CURRENT_TIMESTAMP
             WHERE id = ?1",
            params![
                batch_id,
                imported,
                updated,
                skipped,
                failed,
                serde_json::to_string(&errors).unwrap_or_else(|_| "[]".into()),
            ],
        )?;
        tx.commit()?;

        Ok(ProductImportReportDto {
            batch_id,
            imported,
            updated,
            skipped,
            failed,
            custom_fields_saved,
            rolled_back: false,
            errors,
        })
    }

    fn save_product(&self, input: &ProductInput, id: Option<&str>) -> AppResult<ProductDto> {
        self.validate_product(input, id)?;
        let id = id.filter(|value| !value.is_empty()).map(str::to_owned).unwrap_or_else(new_id);
        self.connection.execute(
            "INSERT INTO products (id, category_id, preferred_supplier_id, sku, barcode, name, brand, motorcycle_application, notes, unit, cost_price_cents, sale_price_cents, margin_percent, min_stock_quantity, current_stock_quantity, location)
             VALUES (?1, NULLIF(?2,''), NULLIF(?3,''), ?4, NULLIF(?5,''), ?6, NULLIF(?7,''), NULLIF(?8,''), NULLIF(?9,''), ?10, ?11, ?12, ?13, ?14, ?15, NULLIF(?16,''))
             ON CONFLICT(id) DO UPDATE SET category_id = excluded.category_id, preferred_supplier_id = excluded.preferred_supplier_id,
               sku = excluded.sku, barcode = excluded.barcode, name = excluded.name, brand = excluded.brand,
               motorcycle_application = excluded.motorcycle_application, notes = excluded.notes, unit = excluded.unit,
               cost_price_cents = excluded.cost_price_cents, sale_price_cents = excluded.sale_price_cents, margin_percent = excluded.margin_percent,
               min_stock_quantity = excluded.min_stock_quantity, current_stock_quantity = excluded.current_stock_quantity,
               location = excluded.location, is_active = 1, deleted_at = NULL",
            params![id, input.category_id, input.supplier_id, input.sku, input.barcode, input.name, input.brand, input.motorcycle_application,
                input.notes, input.unit, input.cost_price_cents, input.sale_price_cents,
                if input.sale_price_cents > 0 { (input.sale_price_cents - input.cost_price_cents) as f64 / input.sale_price_cents as f64 * 100.0 } else { 0.0 },
                input.min_stock_quantity, input.current_stock_quantity, input.location],
        )?;
        save_custom_fields(self.connection, &id, &input.custom_fields)?;
        self.list_products()?.into_iter().find(|product| product.id == id).ok_or_else(|| AppError::Validation("Produto nao encontrado apos salvar.".into()))
    }

    fn list_product_custom_fields(&self, product_id: &str) -> AppResult<Vec<ProductCustomFieldDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, product_id, field_key, field_label, field_type, field_value, created_at, updated_at
             FROM product_custom_fields
             WHERE product_id = ?1
             ORDER BY field_label",
        )?;
        let rows = stmt
            .query_map([product_id], |row| {
                Ok(ProductCustomFieldDto {
                    id: row.get(0)?,
                    product_id: row.get(1)?,
                    field_key: row.get(2)?,
                    field_label: row.get(3)?,
                    field_type: row.get(4)?,
                    field_value: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn deactivate_product(&self, id: &str) -> AppResult<()> {
        self.connection.execute("UPDATE products SET is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn create_stock_entry(&self, input: &StockMovementInput) -> AppResult<()> {
        self.create_stock_movement(input)
    }

    pub fn create_stock_adjustment(&self, input: &StockMovementInput) -> AppResult<()> {
        self.create_stock_movement(input)
    }

    fn create_stock_movement(&self, input: &StockMovementInput) -> AppResult<()> {
        self.validate_stock_movement(input)?;
        self.connection.execute(
            "INSERT INTO stock_movements (id, product_id, movement_type, direction, quantity, unit_cost_cents, unit_price_cents, reason, reference_id, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULLIF(?9,''), ?10)",
            params![new_id(), input.product_id, input.movement_type, input.direction, input.quantity, input.unit_cost_cents, input.unit_price_cents, input.reason, input.reference_id, input.notes],
        )?;
        Ok(())
    }

    pub fn list_stock_movements(&self, product_id: Option<&str>) -> AppResult<Vec<StockMovementDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, product_id, movement_type, direction, quantity, COALESCE(reason,''), COALESCE(reference_id,''),
                    unit_cost_cents, unit_price_cents, created_at
             FROM stock_movements
             WHERE deleted_at IS NULL AND (?1 IS NULL OR product_id = ?1)
             ORDER BY created_at DESC",
        )?;
        let rows = stmt.query_map([product_id], |row| Ok(StockMovementDto {
            id: row.get(0)?,
            product_id: row.get(1)?,
            movement_type: row.get(2)?,
            direction: row.get(3)?,
            quantity: row.get(4)?,
            reason: row.get(5)?,
            reference_id: row.get(6)?,
            unit_cost_cents: row.get(7)?,
            unit_price_cents: row.get(8)?,
            created_at: row.get(9)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn get_low_stock_products(&self) -> AppResult<Vec<ProductDto>> {
        Ok(self.list_products()?.into_iter().filter(|product| product.current_stock_quantity > 0.0 && product.current_stock_quantity <= product.min_stock_quantity).collect())
    }

    pub fn get_out_of_stock_products(&self) -> AppResult<Vec<ProductDto>> {
        Ok(self.list_products()?.into_iter().filter(|product| product.current_stock_quantity <= 0.0).collect())
    }

    fn validate_product(&self, input: &ProductInput, current_id: Option<&str>) -> AppResult<()> {
        if input.name.trim().is_empty() {
            return Err(AppError::Validation("Nome do produto e obrigatorio.".into()));
        }
        if input.cost_price_cents < 0 || input.sale_price_cents < 0 {
            return Err(AppError::Validation("Precos do produto devem ser positivos.".into()));
        }
        if input.current_stock_quantity < 0 || input.min_stock_quantity < 0 {
            return Err(AppError::Validation("Estoque nao pode ser negativo.".into()));
        }
        if input.sku.trim().is_empty() {
            return Err(AppError::Validation("Codigo interno e obrigatorio.".into()));
        }
        let duplicate: bool = self.connection.query_row(
            "SELECT EXISTS(
                SELECT 1 FROM products
                WHERE lower(trim(sku)) = lower(trim(?1))
                  AND deleted_at IS NULL
                  AND (?2 IS NULL OR id <> ?2)
            )",
            params![input.sku.trim(), current_id],
            |row| row.get(0),
        )?;
        if duplicate {
            return Err(AppError::Validation("Este codigo interno ja esta em uso.".into()));
        }
        Ok(())
    }

    fn validate_stock_movement(&self, input: &StockMovementInput) -> AppResult<()> {
        if input.quantity <= 0 {
            return Err(AppError::Validation("Quantidade deve ser maior que zero.".into()));
        }
        if input.direction == "out" {
            let stock: i64 = self.connection.query_row("SELECT CAST(current_stock_quantity AS INTEGER) FROM products WHERE id = ?1 AND deleted_at IS NULL", [input.product_id.as_str()], |row| row.get(0))?;
            if stock < input.quantity {
                return Err(AppError::Validation("Estoque insuficiente para esta movimentacao.".into()));
            }
        }
        Ok(())
    }

    pub fn get_current_cash_session(&self) -> AppResult<Option<CashSessionDto>> {
        Ok(self.connection.query_row(
            "SELECT id, opened_at, closed_at, opening_amount_cents, expected_amount_cents, reported_amount_cents, status
             FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1",
            [],
            map_cash_session,
        ).optional()?)
    }

    pub fn open_cash_session(&self, opening_amount_cents: i64) -> AppResult<CashSessionDto> {
        if opening_amount_cents < 0 {
            return Err(AppError::Validation("Valor inicial invalido.".into()));
        }
        if self.get_current_cash_session()?.is_some() {
            return Err(AppError::Validation("Ja existe um caixa aberto.".into()));
        }
        let id = new_id();
        self.connection.execute(
            "INSERT INTO cash_sessions (id, opening_amount_cents, expected_amount_cents) VALUES (?1, ?2, ?2)",
            params![id, opening_amount_cents],
        )?;
        self.get_current_cash_session()?.ok_or_else(|| AppError::Validation("Nao foi possivel abrir o caixa.".into()))
    }

    pub fn close_cash_session(&mut self, reported_amount_cents: i64) -> AppResult<()> {
        let tx = self.connection.transaction()?;
        let open = tx.query_row(
            "SELECT id, opened_at, closed_at, opening_amount_cents, expected_amount_cents, reported_amount_cents, status
             FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1",
            [],
            map_cash_session,
        ).optional()?.ok_or_else(|| AppError::Validation("Nao existe caixa aberto.".into()))?;
        let updated = tx.execute(
            "UPDATE cash_sessions
             SET closed_at = CURRENT_TIMESTAMP,
                 reported_amount_cents = ?2,
                 difference_cents = ?2 - expected_amount_cents,
                 status = 'closed',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?1 AND status = 'open'",
            params![open.id, reported_amount_cents],
        )?;
        if updated == 0 {
            return Err(AppError::Validation("Nao foi possivel fechar o caixa.".into()));
        }
        #[cfg(debug_assertions)]
        {
            let difference_cents = reported_amount_cents - open.expected_amount_cents;
            eprintln!(
                "close_cash_session: id={} reported={} expected={} difference={}",
                open.id,
                reported_amount_cents,
                open.expected_amount_cents,
                difference_cents,
            );
        }
        tx.commit()?;
        Ok(())
    }

    pub fn list_cash_sessions(&self) -> AppResult<Vec<CashSessionDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, opened_at, closed_at, opening_amount_cents, expected_amount_cents, reported_amount_cents, status
             FROM cash_sessions ORDER BY opened_at DESC",
        )?;
        let rows = stmt.query_map([], map_cash_session)?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn create_cash_income(&self, description: &str, amount_cents: i64, payment_method: &str, reference_id: &str) -> AppResult<()> {
        self.create_cash_movement("income", "manual_revenue", description, amount_cents, payment_method, reference_id)
    }

    pub fn create_cash_expense(&self, description: &str, amount_cents: i64, payment_method: &str, reference_id: &str) -> AppResult<()> {
        self.create_cash_movement("expense", "manual_expense", description, amount_cents, payment_method, reference_id)
    }

    fn create_cash_movement(&self, movement_type: &str, source: &str, description: &str, amount_cents: i64, payment_method: &str, reference_id: &str) -> AppResult<()> {
        if amount_cents <= 0 {
            return Err(AppError::Validation("Valor do movimento deve ser maior que zero.".into()));
        }
        let session = self.get_current_cash_session()?.ok_or_else(|| AppError::Validation("Caixa fechado.".into()))?;
        let (legacy_type, direction) = if movement_type == "income" { ("cash_in", "in") } else { ("expense", "out") };
        self.connection.execute(
            "INSERT INTO cash_movements (id, cash_session_id, movement_type, direction, amount_cents, description, source, payment_method, reference_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULLIF(?9,''))",
            params![new_id(), session.id, legacy_type, direction, amount_cents, description, source, payment_method, reference_id],
        )?;
        self.connection.execute(
            "UPDATE cash_sessions
             SET expected_amount_cents = expected_amount_cents + ?1
             WHERE id = ?2",
            params![if direction == "in" { amount_cents } else { -amount_cents }, session.id],
        )?;
        Ok(())
    }

    pub fn create_sale(&mut self, input: &CreateSaleInput) -> AppResult<SaleResultDto> {
        let session = self.get_current_cash_session()?.ok_or_else(|| AppError::Validation("Caixa fechado. Abra o caixa para finalizar vendas.".into()))?;
        if input.items.is_empty() {
            return Err(AppError::Validation("Venda sem itens.".into()));
        }

        let customer_id = input.customer_id.as_deref().and_then(|value| {
            let trimmed = value.trim();
            (!trimmed.is_empty()).then(|| trimmed.to_owned())
        });

        if let Some(customer_id) = &customer_id {
            let exists: bool = self.connection.query_row(
                "SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?1 AND deleted_at IS NULL)",
                [customer_id],
                |row| row.get(0),
            )?;
            if !exists {
                return Err(AppError::Validation("Cliente selecionado nao existe.".into()));
            }
        }

        let discount_type = input.discount_type.as_deref().unwrap_or("value");
        if !matches!(discount_type, "value" | "percentage") {
            return Err(AppError::Validation("Tipo de desconto invalido.".into()));
        }
        let discount_amount = input.discount_amount.unwrap_or(0.0);
        if discount_amount < 0.0 {
            return Err(AppError::Validation("Desconto nao pode ser negativo.".into()));
        }

        let tx = self.connection.transaction()?;
        let sale_number: String = tx.query_row("SELECT printf('%06d', COALESCE(MAX(CAST(sale_number AS INTEGER)), 0) + 1) FROM sales", [], |row| row.get(0))?;
        let sale_id = new_id();

        // First pass: validate items and collect enriched data, compute subtotal/costs
        struct EnrichedItem {
            product_id: String,
            quantity: f64,
            unit_cost_cents: i64,
            unit_price_cents: i64,
            discount_cents: i64,
            product_name: String,
            product_sku: Option<String>,
        }

        let mut enriched: Vec<EnrichedItem> = Vec::with_capacity(input.items.len());
        let mut subtotal = 0_i64;
        let mut item_discount = 0_i64;
        let mut total_cost = 0_i64;

        for item in &input.items {
            if item.product_id.trim().is_empty() {
                return Err(AppError::Validation("Produto nao encontrado.".into()));
            }
            if item.quantity <= 0.0 || item.quantity.fract() != 0.0 {
                return Err(AppError::Validation("Quantidade da venda deve ser inteira e maior que zero.".into()));
            }
            let product = tx.query_row(
                "SELECT current_stock_quantity, name, sku FROM products WHERE id = ?1 AND is_active = 1 AND deleted_at IS NULL",
                [item.product_id.as_str()],
                |row| Ok((row.get::<_, f64>(0)?, row.get::<_, String>(1)?, row.get::<_, Option<String>>(2)?)),
            ).optional()?;
            let Some((stock, name, sku)) = product else {
                return Err(AppError::Validation("Produto nao encontrado.".into()));
            };
            if stock < item.quantity {
                return Err(AppError::Validation(format!("Estoque insuficiente para {}.", name)));
            }
            subtotal += (item.quantity * item.unit_price_cents as f64).round() as i64;
            item_discount += item.discount_cents;
            total_cost += (item.quantity * item.unit_cost_cents as f64).round() as i64;

            enriched.push(EnrichedItem {
                product_id: item.product_id.clone(),
                quantity: item.quantity,
                unit_cost_cents: item.unit_cost_cents,
                unit_price_cents: item.unit_price_cents,
                discount_cents: item.discount_cents,
                product_name: name,
                product_sku: sku,
            });
        }

        let sale_discount = if discount_type == "percentage" {
            if discount_amount > 100.0 {
                return Err(AppError::Validation("Desconto percentual nao pode ser maior que 100%.".into()));
            }
            ((subtotal as f64) * (discount_amount / 100.0)).round() as i64
        } else {
            (discount_amount * 100.0).round() as i64
        };

        let discount = item_discount + sale_discount;
        if discount > subtotal {
            return Err(AppError::Validation("Desconto maior que o subtotal da venda.".into()));
        }

        let total = subtotal - discount;
        let paid: i64 = input.payments.iter().map(|payment| payment.amount_cents).sum();
        if paid < total {
            return Err(AppError::Validation("Pagamento insuficiente.".into()));
        }
        let gross_profit = total - total_cost;
        let margin_percent = if total > 0 { gross_profit as f64 / total as f64 * 100.0 } else { 0.0 };
        // Insert sale row now that totals are known
        tx.execute(
            "INSERT INTO sales (id, sale_number, customer_id, status, sold_at, subtotal_cents, discount_cents, discount_type, discount_amount, total_cents, total_cost_cents, gross_profit_cents, margin_percent, paid_cents, change_cents)
             VALUES (?1, ?2, ?3, 'completed', CURRENT_TIMESTAMP, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![sale_id, sale_number, customer_id, subtotal, discount, discount_type, discount_amount, total, total_cost, gross_profit, margin_percent, paid, paid - total],
        )?;

        // Second pass: insert sale_items and stock_movements using the existing sale_id
        for item in &enriched {
            tx.execute(
                "INSERT INTO sale_items (id, sale_id, product_id, product_sku, product_name, quantity, unit_cost_cents, unit_price_cents, discount_cents)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![new_id(), sale_id, item.product_id, item.product_sku, item.product_name, item.quantity, item.unit_cost_cents, item.unit_price_cents, item.discount_cents],
            )?;
            tx.execute(
                "INSERT INTO stock_movements (id, product_id, sale_id, movement_type, direction, quantity, unit_cost_cents, notes)
                 VALUES (?1, ?2, ?3, 'sale', 'out', ?4, ?5, ?6)",
                params![new_id(), item.product_id, sale_id, item.quantity, item.unit_cost_cents, format!("Baixa automatica venda {}", sale_number)],
            )?;
        }

        let mut remaining_to_allocate = total;
        for payment in &input.payments {
            if remaining_to_allocate <= 0 {
                break;
            }
            let allocated_amount = payment.amount_cents.min(remaining_to_allocate);
            remaining_to_allocate -= allocated_amount;

            tx.execute(
                "INSERT INTO cash_movements (id, cash_session_id, sale_id, movement_type, direction, amount_cents, description, reference_code, source, payment_method, reference_id)
                 VALUES (?1, ?2, ?3, 'sale_payment', 'in', ?4, ?5, ?6, 'sale', ?7, ?3)",
                params![new_id(), session.id, sale_id, allocated_amount, format!("Recebimento venda {}", sale_number), sale_number, payment.method],
            )?;
            tx.execute(
                "INSERT INTO financial_transactions (id, cash_session_id, type, description, amount_cents, paid_at, status, payment_method, notes)
                 VALUES (?1, ?2, 'income', ?3, ?4, CURRENT_TIMESTAMP, 'received', ?5, ?6)",
                params![new_id(), session.id, format!("Venda {}", sale_number), allocated_amount, payment.method, sale_id],
            )?;
        }

        tx.execute("UPDATE cash_sessions SET expected_amount_cents = expected_amount_cents + ?1 WHERE status = 'open'", [total])?;
        tx.commit()?;
        Ok(SaleResultDto { sale_number, total_cents: total, gross_profit_cents: gross_profit, margin_percent, stock_movements: enriched.len() })
    }

    pub fn list_sales(&self, start_date: &str, end_date: &str) -> AppResult<Vec<SaleRecordDto>> {
        let start = range_start(start_date);
        let end = range_end(end_date);
        let mut stmt = self.connection.prepare(
            "SELECT s.id, s.sale_number, s.sold_at, COALESCE(c.name,'Balcao'), COUNT(si.id),
                    COALESCE((SELECT payment_method FROM financial_transactions ft WHERE ft.notes = s.id LIMIT 1),'cash'),
                    s.total_cents, s.total_cost_cents, s.discount_cents, 0, s.status
             FROM sales s LEFT JOIN customers c ON c.id = s.customer_id LEFT JOIN sale_items si ON si.sale_id = s.id
             WHERE datetime(s.sold_at, 'localtime') >= datetime(?1)
               AND datetime(s.sold_at, 'localtime') <= datetime(?2)
               AND s.deleted_at IS NULL
             GROUP BY s.id ORDER BY s.sold_at DESC",
        )?;
        let rows = stmt.query_map(params![start, end], |row| Ok(SaleRecordDto {
            id: row.get(0)?,
            sale_number: row.get(1)?,
            sold_at: row.get(2)?,
            customer_name: row.get(3)?,
            items_count: row.get(4)?,
            payment_method: row.get(5)?,
            total_cents: row.get(6)?,
            cost_cents: row.get(7)?,
            discount_cents: row.get(8)?,
            fee_cents: row.get(9)?,
            status: row.get(10)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn cancel_sale(&mut self, id: &str) -> AppResult<()> {
        let tx = self.connection.transaction()?;
        let exists: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM sales WHERE id = ?1 AND status = 'completed' AND deleted_at IS NULL)",
            [id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::Validation("Venda nao encontrada ou ja cancelada.".into()));
        }
        tx.execute("UPDATE sales SET status = 'cancelled' WHERE id = ?1", [id])?;
        tx.execute("UPDATE cash_movements SET status = 'cancelled' WHERE sale_id = ?1", [id])?;
        tx.execute("UPDATE financial_transactions SET status = 'pending' WHERE notes = ?1", [id])?;
        tx.commit()?;
        Ok(())
    }

    pub fn list_cash_movements(&self, start_date: &str, end_date: &str) -> AppResult<Vec<CashMovementDto>> {
        let start = range_start(start_date);
        let end = range_end(end_date);
        let mut stmt = self.connection.prepare(
            "SELECT id, occurred_at, COALESCE(description,''), movement_type, source, direction, amount_cents,
                    COALESCE(payment_method, (SELECT payment_method FROM financial_transactions ft WHERE ft.notes = cash_movements.sale_id LIMIT 1), 'cash'), status
             FROM cash_movements
             WHERE datetime(occurred_at, 'localtime') >= datetime(?1)
               AND datetime(occurred_at, 'localtime') <= datetime(?2)
               AND deleted_at IS NULL
             ORDER BY occurred_at DESC",
        )?;
        let rows = stmt.query_map(params![start, end], |row| Ok(CashMovementDto {
            id: row.get(0)?,
            occurred_at: row.get(1)?,
            description: row.get(2)?,
            movement_type: row.get(3)?,
            source: row.get(4)?,
            direction: row.get(5)?,
            amount_cents: row.get(6)?,
            payment_method: row.get(7)?,
            status: row.get(8)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn list_financial_transactions(&self, start_date: &str, end_date: &str) -> AppResult<Vec<FinancialTransactionDto>> {
        let start = range_start(start_date);
        let end = range_end(end_date);
        let mut stmt = self.connection.prepare(
            "SELECT id, COALESCE(paid_at, due_date, created_at), description, type, amount_cents, status, COALESCE(payment_method,'')
             FROM financial_transactions
             WHERE CASE
                     WHEN paid_at IS NOT NULL THEN datetime(paid_at, 'localtime')
                     WHEN due_date IS NOT NULL THEN datetime(due_date || ' 12:00:00')
                     ELSE datetime(created_at, 'localtime')
                   END >= datetime(?1)
               AND CASE
                     WHEN paid_at IS NOT NULL THEN datetime(paid_at, 'localtime')
                     WHEN due_date IS NOT NULL THEN datetime(due_date || ' 12:00:00')
                     ELSE datetime(created_at, 'localtime')
                   END <= datetime(?2)
               AND deleted_at IS NULL
             ORDER BY COALESCE(paid_at, due_date, created_at) DESC",
        )?;
        let rows = stmt.query_map(params![start, end], |row| Ok(FinancialTransactionDto {
            id: row.get(0)?,
            occurred_at: row.get(1)?,
            description: row.get(2)?,
            transaction_type: row.get(3)?,
            amount_cents: row.get(4)?,
            status: row.get(5)?,
            payment_method: row.get(6)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn list_payables(&self) -> AppResult<Vec<PayableDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, description, category_type, amount_cents, due_date, COALESCE(company_or_supplier,''), recurrence_type,
                    CASE WHEN status = 'paid' THEN 'paid'
                         WHEN DATE(due_date) < DATE('now','localtime') THEN 'overdue'
                         ELSE 'open' END,
                    paid_at, created_at, updated_at
             FROM accounts_payable
             WHERE deleted_at IS NULL
               AND status <> 'paid'
               AND (recurrence_type = 'unique' OR DATE(due_date) <= DATE('now','localtime','+7 day'))
             ORDER BY DATE(due_date) ASC, created_at DESC",
        )?;
        let rows = stmt.query_map([], |row| Ok(PayableDto {
            id: row.get(0)?,
            description: row.get(1)?,
            category_type: row.get(2)?,
            amount_cents: row.get(3)?,
            due_date: row.get(4)?,
            company_or_supplier: row.get(5)?,
            recurrence_type: row.get(6)?,
            status: row.get(7)?,
            paid_at: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn save_payable(&self, input: &PayableInput) -> AppResult<PayableDto> {
        if input.description.trim().is_empty() {
            return Err(AppError::Validation("Descricao da conta a pagar e obrigatoria.".into()));
        }
        if input.amount_cents <= 0 {
            return Err(AppError::Validation("Valor da conta a pagar deve ser maior que zero.".into()));
        }
        if !matches!(input.recurrence_type.as_str(), "unique" | "monthly") {
            return Err(AppError::Validation("Recorrencia invalida para conta a pagar.".into()));
        }
        let id = input.id.clone().filter(|value| !value.is_empty()).unwrap_or_else(new_id);
        self.connection.execute(
            "INSERT INTO accounts_payable (id, description, category_type, amount_cents, due_date, company_or_supplier, recurrence_type, status)
             VALUES (?1, ?2, ?3, ?4, ?5, NULLIF(?6,''), ?7, 'open')
             ON CONFLICT(id) DO UPDATE SET
               description = excluded.description,
               category_type = excluded.category_type,
               amount_cents = excluded.amount_cents,
               due_date = excluded.due_date,
               company_or_supplier = excluded.company_or_supplier,
               recurrence_type = excluded.recurrence_type,
               updated_at = CURRENT_TIMESTAMP",
            params![id, input.description, input.category_type, input.amount_cents, input.due_date, input.company_or_supplier, input.recurrence_type],
        )?;
        self.list_payables()?.into_iter().find(|value| value.id == id).ok_or_else(|| AppError::Validation("Conta a pagar nao encontrada apos salvar.".into()))
    }

    pub fn delete_payable(&self, id: &str) -> AppResult<()> {
        self.connection.execute(
            "UPDATE accounts_payable SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?1 AND deleted_at IS NULL",
            [id],
        )?;
        Ok(())
    }

    pub fn mark_payable_as_paid(&mut self, id: &str) -> AppResult<()> {
        let tx = self.connection.transaction()?;
        let (description, category_type, amount_cents, due_date, company_or_supplier, recurrence_type, status): (String, String, i64, String, Option<String>, String, String) = tx.query_row(
            "SELECT description, category_type, amount_cents, due_date, company_or_supplier, recurrence_type, status
             FROM accounts_payable
             WHERE id = ?1 AND deleted_at IS NULL",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?)),
        )?;
        if status == "paid" {
            return Err(AppError::Validation("Conta a pagar ja esta marcada como paga.".into()));
        }

        tx.execute(
            "UPDATE accounts_payable SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
            [id],
        )?;
        tx.execute(
            "INSERT INTO financial_transactions (id, type, description, amount_cents, due_date, paid_at, status, payment_method, notes)
             VALUES (?1, 'expense', ?2, ?3, ?4, CURRENT_TIMESTAMP, 'paid', 'cash', ?5)",
            params![new_id(), description, amount_cents, due_date, format!("accounts_payable:{}:{}", category_type, company_or_supplier.clone().unwrap_or_default())],
        )?;

        if recurrence_type == "monthly" {
            let next_due_date: String = tx.query_row("SELECT DATE(?1, '+1 month')", [due_date.as_str()], |row| row.get(0))?;
            tx.execute(
                "INSERT INTO accounts_payable (id, description, category_type, amount_cents, due_date, company_or_supplier, recurrence_type, status)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'monthly', 'open')",
                params![new_id(), description, category_type, amount_cents, next_due_date, company_or_supplier],
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    pub fn list_receivables(&self) -> AppResult<Vec<ReceivableDto>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, description, customer, amount_cents, due_date, recurrence_type,
                    CASE WHEN status = 'received' THEN 'received'
                         WHEN DATE(due_date) < DATE('now','localtime') THEN 'overdue'
                         ELSE 'open' END,
                    received_at, created_at, updated_at
             FROM accounts_receivable
             WHERE deleted_at IS NULL
               AND status <> 'received'
               AND (recurrence_type = 'unique' OR DATE(due_date) <= DATE('now','localtime','+7 day'))
             ORDER BY DATE(due_date) ASC, created_at DESC",
        )?;
        let rows = stmt.query_map([], |row| Ok(ReceivableDto {
            id: row.get(0)?,
            description: row.get(1)?,
            customer: row.get(2)?,
            amount_cents: row.get(3)?,
            due_date: row.get(4)?,
            recurrence_type: row.get(5)?,
            status: row.get(6)?,
            received_at: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn save_receivable(&self, input: &ReceivableInput) -> AppResult<ReceivableDto> {
        if input.description.trim().is_empty() {
            return Err(AppError::Validation("Descricao da conta a receber e obrigatoria.".into()));
        }
        if input.amount_cents <= 0 {
            return Err(AppError::Validation("Valor da conta a receber deve ser maior que zero.".into()));
        }
        if !matches!(input.recurrence_type.as_str(), "unique" | "monthly") {
            return Err(AppError::Validation("Recorrencia invalida para conta a receber.".into()));
        }
        let id = input.id.clone().filter(|value| !value.is_empty()).unwrap_or_else(new_id);
        self.connection.execute(
            "INSERT INTO accounts_receivable (id, description, customer, amount_cents, due_date, recurrence_type, status)
             VALUES (?1, ?2, NULLIF(?3,''), ?4, ?5, ?6, 'open')
             ON CONFLICT(id) DO UPDATE SET
               description = excluded.description,
               customer = excluded.customer,
               amount_cents = excluded.amount_cents,
               due_date = excluded.due_date,
               recurrence_type = excluded.recurrence_type,
               updated_at = CURRENT_TIMESTAMP",
            params![id, input.description, input.customer, input.amount_cents, input.due_date, input.recurrence_type],
        )?;
        self.list_receivables()?.into_iter().find(|value| value.id == id).ok_or_else(|| AppError::Validation("Conta a receber nao encontrada apos salvar.".into()))
    }

    pub fn delete_receivable(&self, id: &str) -> AppResult<()> {
        self.connection.execute(
            "UPDATE accounts_receivable SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?1 AND deleted_at IS NULL",
            [id],
        )?;
        Ok(())
    }

    pub fn mark_receivable_as_received(&mut self, id: &str) -> AppResult<()> {
        let tx = self.connection.transaction()?;
        let (description, customer, amount_cents, due_date, recurrence_type, status): (String, Option<String>, i64, String, String, String) = tx.query_row(
            "SELECT description, customer, amount_cents, due_date, recurrence_type, status
             FROM accounts_receivable
             WHERE id = ?1 AND deleted_at IS NULL",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?)),
        )?;
        if status == "received" {
            return Err(AppError::Validation("Conta a receber ja esta marcada como recebida.".into()));
        }

        tx.execute(
            "UPDATE accounts_receivable SET status = 'received', received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
            [id],
        )?;
        tx.execute(
            "INSERT INTO financial_transactions (id, type, description, amount_cents, due_date, paid_at, status, payment_method, notes)
             VALUES (?1, 'income', ?2, ?3, ?4, CURRENT_TIMESTAMP, 'received', 'cash', ?5)",
            params![new_id(), description, amount_cents, due_date, format!("accounts_receivable:{}", customer.clone().unwrap_or_default())],
        )?;

        if recurrence_type == "monthly" {
            let next_due_date: String = tx.query_row("SELECT DATE(?1, '+1 month')", [due_date.as_str()], |row| row.get(0))?;
            tx.execute(
                "INSERT INTO accounts_receivable (id, description, customer, amount_cents, due_date, recurrence_type, status)
                 VALUES (?1, ?2, ?3, ?4, ?5, 'monthly', 'open')",
                params![new_id(), description, customer, amount_cents, next_due_date],
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    pub fn get_financial_summary(&self, start_date: &str, end_date: &str) -> AppResult<FinancialSummaryDto> {
        let today: String = self.connection.query_row("SELECT DATE('now','localtime')", [], |row| row.get(0))?;
        let month_start = format!("{}-01", &today[..7]);
        let start = range_start(start_date);
        let end = range_end(end_date);
        let month_start_inclusive = range_start(&month_start);
        let today_inclusive = range_end(&today);
        let (sales_revenue, profit, sales_count, cogs): (i64, i64, i64, i64) = self.connection.query_row(
            "SELECT COALESCE(SUM(total_cents),0), COALESCE(SUM(gross_profit_cents),0), COUNT(*), COALESCE(SUM(total_cost_cents),0)
             FROM sales
             WHERE status = 'completed'
               AND datetime(sold_at, 'localtime') >= datetime(?1)
               AND datetime(sold_at, 'localtime') <= datetime(?2)
               AND deleted_at IS NULL",
            params![start, end],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )?;
        let manual_revenue: i64 = self.connection.query_row(
            "SELECT COALESCE(SUM(amount_cents),0) FROM cash_movements
             WHERE source = 'manual_revenue' AND status = 'confirmed'
               AND datetime(occurred_at, 'localtime') >= datetime(?1)
               AND datetime(occurred_at, 'localtime') <= datetime(?2)
               AND deleted_at IS NULL",
            params![start, end],
            |row| row.get(0),
        )?;
        let expenses: i64 = self.connection.query_row(
            "SELECT COALESCE(SUM(amount_cents),0) FROM cash_movements
             WHERE source = 'manual_expense' AND status = 'confirmed'
               AND datetime(occurred_at, 'localtime') >= datetime(?1)
               AND datetime(occurred_at, 'localtime') <= datetime(?2)
               AND deleted_at IS NULL",
            params![start, end],
            |row| row.get(0),
        )?;
        let revenue_today: i64 = self.connection.query_row(
            "SELECT COALESCE(SUM(total_cents),0) FROM sales
             WHERE status = 'completed' AND DATE(sold_at, 'localtime') = ?1 AND deleted_at IS NULL",
            [today.as_str()],
            |row| row.get(0),
        )?;
        let revenue_month: i64 = self.connection.query_row(
            "SELECT COALESCE(SUM(total_cents),0) FROM sales
             WHERE status = 'completed'
               AND datetime(sold_at, 'localtime') >= datetime(?1)
               AND datetime(sold_at, 'localtime') <= datetime(?2)
               AND deleted_at IS NULL",
            params![month_start_inclusive, today_inclusive],
            |row| row.get(0),
        )?;
        let cash_total: i64 = self.connection.query_row(
            "SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_cents ELSE -amount_cents END),0)
             FROM cash_movements
             WHERE status = 'confirmed'
               AND datetime(occurred_at, 'localtime') >= datetime(?1)
               AND datetime(occurred_at, 'localtime') <= datetime(?2)
               AND deleted_at IS NULL",
            params![start, end],
            |row| row.get(0),
        )?;
        Ok(FinancialSummaryDto {
            revenue_total_cents: sales_revenue + manual_revenue,
            revenue_today_cents: revenue_today,
            revenue_month_cents: revenue_month,
            expenses_total_cents: expenses,
            gross_profit_cents: profit,
            estimated_net_profit_cents: profit + manual_revenue - expenses,
            average_margin_percent: if sales_revenue > 0 { profit as f64 / sales_revenue as f64 * 100.0 } else { 0.0 },
            average_ticket_cents: if sales_count > 0 { sales_revenue / sales_count } else { 0 },
            sales_count,
            cost_of_goods_sold_cents: cogs,
            cash_total_cents: cash_total,
            sales_by_period: self.daily_totals("sales", start_date, end_date)?,
            expenses_by_period: self.daily_totals("expenses", start_date, end_date)?,
        })
    }

    pub fn get_top_selling_categories(&self, start_date: &str, end_date: &str) -> AppResult<Vec<TopSellingCategoryDto>> {
        let start = range_start(start_date);
        let end = range_end(end_date);
        let total_quantity: f64 = self.connection.query_row(
            "SELECT COALESCE(SUM(si.quantity), 0)
             FROM sales s
             JOIN sale_items si ON si.sale_id = s.id
             WHERE s.status = 'completed'
               AND datetime(s.sold_at, 'localtime') >= datetime(?1)
               AND datetime(s.sold_at, 'localtime') <= datetime(?2)
               AND s.deleted_at IS NULL
               AND si.deleted_at IS NULL",
            params![start.as_str(), end.as_str()],
            |row| row.get(0),
        )?;

        let mut stmt = self.connection.prepare(
            "SELECT
                COALESCE(c.id, pc.id),
                COALESCE(c.name, pc.name, 'Sem categoria'),
                COALESCE(SUM(si.quantity), 0),
                COALESCE(SUM(si.line_total_cents), 0),
                COALESCE(SUM(si.gross_profit_cents), 0)
             FROM sales s
             JOIN sale_items si ON si.sale_id = s.id
             LEFT JOIN products p ON p.id = si.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN product_categories pc ON pc.id = p.category_id
             WHERE s.status = 'completed'
               AND datetime(s.sold_at, 'localtime') >= datetime(?1)
               AND datetime(s.sold_at, 'localtime') <= datetime(?2)
               AND s.deleted_at IS NULL
               AND si.deleted_at IS NULL
             GROUP BY COALESCE(c.id, pc.id), COALESCE(c.name, pc.name, 'Sem categoria')
             ORDER BY SUM(si.quantity) DESC, SUM(si.line_total_cents) DESC",
        )?;

        let rows = stmt
            .query_map(params![start, end], |row| {
                let quantity_sold: f64 = row.get(2)?;
                Ok(TopSellingCategoryDto {
                    category_id: row.get(0)?,
                    category_name: row.get(1)?,
                    quantity_sold,
                    revenue_total_cents: row.get(3)?,
                    gross_profit_cents: row.get(4)?,
                    percentage: if total_quantity > 0.0 {
                        quantity_sold / total_quantity * 100.0
                    } else {
                        0.0
                    },
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(rows)
    }

    pub fn get_sales_report(&self, start_date: &str, end_date: &str, payment_method: Option<&str>, customer_id: Option<&str>) -> AppResult<Value> {
        let sales = self.list_sales(start_date, end_date)?
            .into_iter()
            .filter(|sale| payment_method.map(|value| sale.payment_method == value).unwrap_or(true))
            .filter(|sale| customer_id.map(|value| self.sale_customer_id(&sale.id).ok().flatten().as_deref() == Some(value)).unwrap_or(true))
            .collect::<Vec<_>>();
        let top_products = self.top_selling_products(start_date, end_date)?;
        Ok(json!({ "sales": sales, "topProducts": top_products }))
    }

    pub fn get_profit_report(&self, start_date: &str, end_date: &str) -> AppResult<Value> {
        Ok(json!({ "summary": self.get_financial_summary(start_date, end_date)? }))
    }

    pub fn get_stock_report(&self, category_id: Option<&str>, supplier_id: Option<&str>) -> AppResult<Value> {
        let products = self.list_products()?
            .into_iter()
            .filter(|product| category_id.map(|value| product.category_id == value).unwrap_or(true))
            .filter(|product| supplier_id.map(|value| product.supplier_id.as_deref() == Some(value)).unwrap_or(true))
            .collect::<Vec<_>>();
        let low_stock = products.iter().filter(|product| product.current_stock_quantity > 0.0 && product.current_stock_quantity <= product.min_stock_quantity).collect::<Vec<_>>();
        let out_of_stock = products.iter().filter(|product| product.current_stock_quantity <= 0.0).collect::<Vec<_>>();
        let inactive = self.list_inactive_products()?;
        Ok(json!({ "products": products, "lowStock": low_stock, "outOfStock": out_of_stock, "inactiveProducts": inactive }))
    }

    pub fn get_cash_report(&self, start_date: &str, end_date: &str) -> AppResult<Value> {
        Ok(json!({ "movements": self.list_cash_movements(start_date, end_date)? }))
    }

    pub fn get_customers_report(&self, start_date: &str, end_date: &str) -> AppResult<Value> {
        let start = range_start(start_date);
        let end = range_end(end_date);
        let mut stmt = self.connection.prepare(
            "SELECT c.id, c.name, COUNT(s.id), COALESCE(SUM(s.total_cents),0)
             FROM customers c
             JOIN sales s ON s.customer_id = c.id
             WHERE s.status = 'completed'
               AND datetime(s.sold_at, 'localtime') >= datetime(?1)
               AND datetime(s.sold_at, 'localtime') <= datetime(?2)
             GROUP BY c.id, c.name
             ORDER BY SUM(s.total_cents) DESC",
        )?;
        let rows = stmt.query_map(params![start, end], |row| Ok(json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "purchaseCount": row.get::<_, i64>(2)?,
            "totalCents": row.get::<_, i64>(3)?,
        })))?.collect::<Result<Vec<_>, _>>()?;
        Ok(json!({ "customers": rows }))
    }

    pub fn get_inventory_valuation_report(&self, category_id: Option<&str>, supplier_id: Option<&str>) -> AppResult<Value> {
        let products = self.list_products()?
            .into_iter()
            .filter(|product| category_id.map(|value| product.category_id == value).unwrap_or(true))
            .filter(|product| supplier_id.map(|value| product.supplier_id.as_deref() == Some(value)).unwrap_or(true))
            .collect::<Vec<_>>();
        let cost_total: i64 = products
            .iter()
            .map(|product| (product.cost_price_cents as f64 * product.current_stock_quantity).round() as i64)
            .sum();
        let sale_total: i64 = products
            .iter()
            .map(|product| (product.sale_price_cents as f64 * product.current_stock_quantity).round() as i64)
            .sum();
        Ok(json!({ "products": products, "costTotalCents": cost_total, "saleTotalCents": sale_total, "potentialProfitCents": sale_total - cost_total }))
    }

    fn top_selling_products(&self, start_date: &str, end_date: &str) -> AppResult<Vec<Value>> {
        let start = range_start(start_date);
        let end = range_end(end_date);
        let mut stmt = self.connection.prepare(
            "SELECT si.product_id, si.product_name, SUM(si.quantity), SUM(si.line_total_cents)
             FROM sale_items si JOIN sales s ON s.id = si.sale_id
             WHERE s.status = 'completed'
               AND datetime(s.sold_at, 'localtime') >= datetime(?1)
               AND datetime(s.sold_at, 'localtime') <= datetime(?2)
             GROUP BY si.product_id, si.product_name ORDER BY SUM(si.quantity) DESC LIMIT 10",
        )?;
        let rows = stmt.query_map(params![start, end], |row| Ok(json!({
            "productId": row.get::<_, Option<String>>(0)?,
            "productName": row.get::<_, String>(1)?,
            "quantity": row.get::<_, f64>(2)?,
            "totalCents": row.get::<_, i64>(3)?,
        })))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    fn list_inactive_products(&self) -> AppResult<Vec<Value>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, sku, deleted_at FROM products WHERE is_active = 0 OR deleted_at IS NOT NULL ORDER BY updated_at DESC",
        )?;
        let rows = stmt.query_map([], |row| Ok(json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "sku": row.get::<_, Option<String>>(2)?,
            "deletedAt": row.get::<_, Option<String>>(3)?,
        })))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    fn sale_customer_id(&self, sale_id: &str) -> AppResult<Option<String>> {
        Ok(self.connection.query_row("SELECT customer_id FROM sales WHERE id = ?1", [sale_id], |row| row.get(0)).optional()?)
    }

    fn daily_totals(&self, kind: &str, start_date: &str, end_date: &str) -> AppResult<Vec<DailyTotalDto>> {
        let start = range_start(start_date);
        let end = range_end(end_date);
        let (sql, params) = if kind == "sales" {
            (
                "SELECT DATE(sold_at, 'localtime'), COALESCE(SUM(total_cents),0) FROM sales
                 WHERE status = 'completed'
                   AND datetime(sold_at, 'localtime') >= datetime(?1)
                   AND datetime(sold_at, 'localtime') <= datetime(?2)
                   AND deleted_at IS NULL
                 GROUP BY DATE(sold_at, 'localtime') ORDER BY DATE(sold_at, 'localtime')",
                params![start, end],
            )
        } else {
            (
                "SELECT DATE(occurred_at, 'localtime'), COALESCE(SUM(amount_cents),0) FROM cash_movements
                 WHERE source = 'manual_expense' AND status = 'confirmed'
                   AND datetime(occurred_at, 'localtime') >= datetime(?1)
                   AND datetime(occurred_at, 'localtime') <= datetime(?2)
                   AND deleted_at IS NULL
                 GROUP BY DATE(occurred_at, 'localtime') ORDER BY DATE(occurred_at, 'localtime')",
                params![start, end],
            )
        };
        let mut stmt = self.connection.prepare(sql)?;
        let rows = stmt.query_map(params, |row| Ok(DailyTotalDto {
            date: row.get(0)?,
            amount_cents: row.get(1)?,
        }))?.collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}

fn range_start(value: &str) -> String {
    if value.len() == 10 {
        format!("{value} 00:00:00.000")
    } else {
        value.replace('T', " ")
    }
}

fn range_end(value: &str) -> String {
    if value.len() == 10 {
        format!("{value} 23:59:59.999")
    } else {
        value.replace('T', " ")
    }
}

fn build_sku_base(category: &str, brand: &str, product_name: &str, motorcycle_application: &str) -> String {
    let mut blocks = vec![
        sku_block(category, 3, "GER"),
        sku_block(brand, 3, "GEN"),
        sku_block(product_name, 4, "PROD"),
    ];
    let application = sku_block(motorcycle_application, 4, "");
    if !application.is_empty() {
        blocks.push(application);
    }
    blocks.join("-")
}

fn sku_block(value: &str, size: usize, fallback: &str) -> String {
    let normalized = deunicode::deunicode(value)
        .to_uppercase()
        .chars()
        .map(|character| if character.is_ascii_alphanumeric() { character } else { '-' })
        .collect::<String>();
    let words = normalized
        .split('-')
        .filter(|word| !word.is_empty())
        .collect::<Vec<_>>();
    if words.is_empty() {
        return fallback.to_string();
    }
    let compact = if words.len() > 1 {
        format!(
            "{}{}",
            words.iter().filter_map(|word| word.chars().next()).collect::<String>(),
            words.join("")
        )
    } else {
        words.join("")
    };
    compact.chars().take(size).collect()
}

fn collect_import_errors(request: &ProductImportRequestDto) -> Vec<ProductImportErrorDto> {
    let mut errors = Vec::new();
    for draft in &request.source.drafts {
        if draft.values.name.trim().is_empty() {
            errors.push(ProductImportErrorDto { row_number: draft.row_number, message: "Nome obrigatorio.".into() });
        }
        for message in &draft.errors {
            errors.push(ProductImportErrorDto { row_number: draft.row_number, message: message.clone() });
        }
    }
    errors
}

fn draft_has_import_error(draft: &ProductImportDraftDto) -> bool {
    !draft.errors.is_empty() || draft.values.name.trim().is_empty()
}

fn source_type_from_file_name(file_name: &str) -> &'static str {
    match file_name.rsplit('.').next().unwrap_or_default().to_ascii_lowercase().as_str() {
        "xls" => "xls",
        "xlsx" => "xlsx",
        _ => "csv",
    }
}

fn find_existing_product_id(connection: &Connection, values: &ProductImportValuesDto) -> AppResult<Option<String>> {
    Ok(connection.query_row(
        "SELECT id
         FROM products
         WHERE deleted_at IS NULL
           AND (
             (?1 <> '' AND lower(trim(sku)) = lower(trim(?1)))
             OR (?2 <> '' AND lower(trim(COALESCE(barcode,''))) = lower(trim(?2)))
             OR (?3 <> '' AND ?4 <> '' AND lower(trim(name)) = lower(trim(?3)) AND lower(trim(COALESCE(brand,''))) = lower(trim(?4)))
             OR (?3 <> '' AND ?5 <> '' AND lower(trim(name)) = lower(trim(?3)) AND lower(trim(COALESCE(motorcycle_application,''))) = lower(trim(?5)))
           )
         LIMIT 1",
        params![values.sku, values.barcode, values.name, values.brand, values.motorcycle_application],
        |row| row.get(0),
    ).optional()?)
}

fn ensure_import_category(connection: &Connection, category_id: &str, category_name: &str) -> AppResult<String> {
    if !category_id.trim().is_empty() {
        let exists: bool = connection.query_row(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE id = ?1 AND deleted_at IS NULL)",
            [category_id],
            |row| row.get(0),
        )?;
        if exists {
            return Ok(category_id.to_owned());
        }
    }

    if category_name.trim().is_empty() {
        return Ok(String::new());
    }

    if let Some(id) = connection.query_row(
        "SELECT id FROM categories WHERE lower(name) = lower(?1) AND deleted_at IS NULL LIMIT 1",
        [category_name],
        |row| row.get::<_, String>(0),
    ).optional()? {
        return Ok(id);
    }

    let id = new_id();
    connection.execute(
        "INSERT INTO categories (id, name, slug, description, is_active) VALUES (?1, ?2, ?3, '', 1)",
        params![id, category_name, slugify(category_name)],
    )?;
    Ok(id)
}

fn ensure_import_supplier(connection: &Connection, supplier_id: &str, supplier_name: &str) -> AppResult<String> {
    if !supplier_id.trim().is_empty() {
        let exists: bool = connection.query_row(
            "SELECT EXISTS(SELECT 1 FROM suppliers WHERE id = ?1 AND deleted_at IS NULL)",
            [supplier_id],
            |row| row.get(0),
        )?;
        if exists {
            return Ok(supplier_id.to_owned());
        }
    }

    if supplier_name.trim().is_empty() {
        return Ok(String::new());
    }

    if let Some(id) = connection.query_row(
        "SELECT id FROM suppliers WHERE lower(name) = lower(?1) AND deleted_at IS NULL LIMIT 1",
        [supplier_name],
        |row| row.get::<_, String>(0),
    ).optional()? {
        return Ok(id);
    }

    let id = new_id();
    connection.execute(
        "INSERT INTO suppliers (id, name, is_active) VALUES (?1, ?2, 1)",
        params![id, supplier_name],
    )?;
    Ok(id)
}

fn insert_import_row(
    connection: &Connection,
    batch_id: &str,
    draft: &ProductImportDraftDto,
    action: &str,
    product_id: Option<&str>,
) -> AppResult<()> {
    connection.execute(
        "INSERT INTO product_import_rows (
            id, batch_id, row_number, action, product_id, sku, barcode, raw_json, errors_json, warnings_json
         ) VALUES (?1, ?2, ?3, ?4, ?5, NULLIF(?6,''), NULLIF(?7,''), ?8, ?9, ?10)",
        params![
            new_id(),
            batch_id,
            draft.row_number,
            action,
            product_id,
            draft.values.sku,
            draft.values.barcode,
            draft.raw.to_string(),
            serde_json::to_string(&draft.errors).unwrap_or_else(|_| "[]".into()),
            serde_json::to_string(&draft.warnings).unwrap_or_else(|_| "[]".into()),
        ],
    )?;
    Ok(())
}

fn save_custom_fields(
    connection: &Connection,
    product_id: &str,
    fields: &[ProductCustomFieldInput],
) -> AppResult<i64> {
    let mut saved = 0;
    for field in fields {
        let field_key = sanitize_field_key(&field.field_key);
        if field_key.is_empty() || field.field_label.trim().is_empty() || !is_valid_custom_field_type(&field.field_type) {
            continue;
        }
        connection.execute(
            "INSERT INTO product_custom_fields (
                id, product_id, field_key, field_label, field_type, field_value
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(product_id, field_key) DO UPDATE SET
                field_label = excluded.field_label,
                field_type = excluded.field_type,
                field_value = excluded.field_value,
                updated_at = CURRENT_TIMESTAMP",
            params![
                new_id(),
                product_id,
                field_key,
                field.field_label.trim(),
                field.field_type,
                field.field_value,
            ],
        )?;
        saved += 1;
    }
    Ok(saved)
}

fn sanitize_field_key(value: &str) -> String {
    let mut sanitized = String::new();
    let mut previous_was_underscore = false;
    for character in slugify(value).chars() {
        let normalized = if character.is_ascii_alphanumeric() { character } else { '_' };
        if normalized == '_' {
            if !previous_was_underscore {
                sanitized.push(normalized);
            }
            previous_was_underscore = true;
        } else {
            sanitized.push(normalized);
            previous_was_underscore = false;
        }
    }
    sanitized.trim_matches('_').to_string()
}

fn is_valid_custom_field_type(value: &str) -> bool {
    matches!(value, "text" | "number" | "currency" | "date" | "boolean")
}

fn map_customer(row: &rusqlite::Row<'_>) -> rusqlite::Result<CustomerDto> {
    Ok(CustomerDto {
        id: row.get(0)?,
        name: row.get(1)?,
        phone: row.get(2)?,
        whatsapp: row.get(3)?,
        motorcycle_model: row.get(4)?,
        document_number: row.get(5)?,
        email: row.get(6)?,
        address: row.get(7)?,
        notes: row.get(8)?,
        active: row.get::<_, i64>(9)? == 1,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

fn map_product(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProductDto> {
        Ok(ProductDto {

        id: row.get(0)?,
        sku: row.get(1)?,
        barcode: row.get(2)?,
        name: row.get(3)?,
        category_id: row.get(4)?,
        category_name: row.get(5)?,
        supplier_id: row.get(6)?,
        supplier_name: row.get(7)?,
        brand: row.get(8)?,
        motorcycle_application: row.get(9)?,
        location: row.get(10)?,
        notes: row.get(11)?,
        unit: row.get(12)?,
        cost_price_cents: row.get(13)?,
        sale_price_cents: row.get(14)?,
        margin_percent: row.get(15)?,
        min_stock_quantity: row_number_as_f64(row, 16)?,
        current_stock_quantity: row_number_as_f64(row, 17)?,

        sold_last_30_days: row.get(18)?,
        last_movement_at: row.get(19)?,
        status: row.get(20)?,
        deleted_at: row.get(21)?,
        created_at: row.get(22)?,
        updated_at: row.get(23)?,
        custom_fields: Vec::new(),
    })
}

fn row_number_as_f64(row: &rusqlite::Row<'_>, index: usize) -> rusqlite::Result<f64> {
    use rusqlite::types::{FromSqlError, FromSqlResult, ValueRef};

    let value = row.get_ref(index)?;
    let parsed: FromSqlResult<f64> = match value {
        ValueRef::Integer(v) => Ok(v as f64),
        ValueRef::Real(v) => Ok(v),
        ValueRef::Text(v) => std::str::from_utf8(v)
            .ok()
            .and_then(|text| text.parse::<f64>().ok())
            .ok_or(FromSqlError::InvalidType),
        ValueRef::Null => Ok(0.0),
        ValueRef::Blob(_) => Err(FromSqlError::InvalidType),
    };

    parsed.map_err(|e| rusqlite::Error::FromSqlConversionFailure(index, value.data_type(), Box::new(e)))
}

fn map_cash_session(row: &rusqlite::Row<'_>) -> rusqlite::Result<CashSessionDto> {
    Ok(CashSessionDto {
        id: row.get(0)?,
        opened_at: row.get(1)?,
        closed_at: row.get(2)?,
        opening_amount_cents: row.get(3)?,
        expected_amount_cents: row.get(4)?,
        reported_amount_cents: row.get(5)?,
        status: row.get(6)?,
    })
}

fn new_id() -> String {
    let millis = SystemTime::now().duration_since(UNIX_EPOCH).map(|value| value.as_millis()).unwrap_or_default();
    format!("id-{}-{}", millis, ID_COUNTER.fetch_add(1, Ordering::Relaxed))
}

fn slugify(value: &str) -> String {
    value.trim().to_lowercase().replace(' ', "-")
}
