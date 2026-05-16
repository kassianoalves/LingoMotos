use crate::app_state::AppState;
use crate::error::{AppError, AppResult};
use crate::repositories::commerce_repository::*;
use crate::services::export_service::ExportService;
use serde_json::Value;
use std::time::Instant;
use tauri::State;

fn db<'a>(state: &'a State<'_, AppState>) -> AppResult<std::sync::MutexGuard<'a, rusqlite::Connection>> {
    state.db.lock().map_err(|_| AppError::StateUnavailable)
}

macro_rules! with_repo {
    ($state:expr, $call:expr) => {{
        let mut db = db(&$state)?;
        let mut repo = CommerceRepository::new(&mut db);
        $call(&mut repo)
    }};
}

#[tauri::command] pub fn get_store_settings(state: State<'_, AppState>) -> AppResult<StoreSettingsDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_store_settings()) }
#[tauri::command] pub fn update_store_settings(state: State<'_, AppState>, settings: StoreSettingsDto) -> AppResult<StoreSettingsDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.update_store_settings(&settings)) }
#[tauri::command] pub fn list_customers(state: State<'_, AppState>) -> AppResult<Vec<CustomerDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_customers()) }
#[tauri::command] pub fn get_customer(state: State<'_, AppState>, id: String) -> AppResult<Option<CustomerDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_customer(&id)) }
#[tauri::command] pub fn create_customer(state: State<'_, AppState>, customer: CustomerInput) -> AppResult<CustomerDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| {
    ensure_cash_open(repo, "Abra o caixa para cadastrar clientes.")?;
    repo.save_customer(&customer)
}) }
#[tauri::command] pub fn update_customer(state: State<'_, AppState>, customer: CustomerInput) -> AppResult<CustomerDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.save_customer(&customer)) }
#[tauri::command] pub fn deactivate_customer(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| {
    ensure_cash_open(repo, "Abra o caixa para cadastrar clientes.")?;
    repo.deactivate_customer(&id)
}) }
#[tauri::command] pub fn list_product_categories(state: State<'_, AppState>) -> AppResult<Vec<CategoryDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_product_categories()) }
#[tauri::command] pub fn create_product_category(state: State<'_, AppState>, name: String, description: String) -> AppResult<CategoryDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_product_category(&name, &description)) }
#[tauri::command] pub fn update_product_category(state: State<'_, AppState>, id: String, name: String, description: String) -> AppResult<CategoryDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.update_product_category(&id, &name, &description)) }
#[tauri::command] pub fn deactivate_product_category(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.deactivate_product_category(&id)) }
#[tauri::command] pub fn list_suppliers(state: State<'_, AppState>) -> AppResult<Vec<SupplierDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_suppliers()) }
#[tauri::command] pub fn create_supplier(state: State<'_, AppState>, supplier: SupplierDto) -> AppResult<SupplierDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_supplier(&supplier)) }
#[tauri::command] pub fn update_supplier(state: State<'_, AppState>, supplier: SupplierDto) -> AppResult<SupplierDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.update_supplier(&supplier)) }
#[tauri::command] pub fn deactivate_supplier(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.deactivate_supplier(&id)) }
#[tauri::command] pub fn list_financial_goals(state: State<'_, AppState>) -> AppResult<Vec<FinancialGoalDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_financial_goals()) }
#[tauri::command] pub fn save_financial_goal(state: State<'_, AppState>, goal: FinancialGoalDto) -> AppResult<FinancialGoalDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.save_financial_goal(&goal)) }
#[tauri::command] pub fn list_products(state: State<'_, AppState>) -> AppResult<Vec<ProductDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_products()) }
#[tauri::command] pub fn get_product(state: State<'_, AppState>, id: String) -> AppResult<Option<ProductDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_product(&id)) }
#[tauri::command] pub fn generate_product_sku(state: State<'_, AppState>, category_id: Option<String>, brand: Option<String>, product_name: String, motorcycle_application: Option<String>) -> AppResult<String> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.generate_product_sku(category_id.as_deref(), brand.as_deref(), &product_name, motorcycle_application.as_deref())) }
#[tauri::command] pub fn create_product(state: State<'_, AppState>, product: ProductInput) -> AppResult<ProductDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_product(&product)) }
#[tauri::command] pub fn update_product(state: State<'_, AppState>, id: String, product: ProductInput) -> AppResult<ProductDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.update_product(&id, &product)) }
#[tauri::command] pub fn deactivate_product(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.deactivate_product(&id)) }
#[tauri::command] pub fn import_products(state: State<'_, AppState>, request: ProductImportRequestDto) -> AppResult<ProductImportReportDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.import_products(&request)) }
#[tauri::command] pub fn list_stock_movements(state: State<'_, AppState>, product_id: Option<String>) -> AppResult<Vec<StockMovementDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_stock_movements(product_id.as_deref())) }
#[tauri::command] pub fn create_stock_entry(state: State<'_, AppState>, movement: StockMovementInput) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_stock_entry(&movement)) }
#[tauri::command] pub fn create_stock_adjustment(state: State<'_, AppState>, movement: StockMovementInput) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_stock_adjustment(&movement)) }
#[tauri::command] pub fn get_low_stock_products(state: State<'_, AppState>) -> AppResult<Vec<ProductDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_low_stock_products()) }
#[tauri::command] pub fn get_out_of_stock_products(state: State<'_, AppState>) -> AppResult<Vec<ProductDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_out_of_stock_products()) }
#[tauri::command] pub fn get_current_cash_session(state: State<'_, AppState>) -> AppResult<Option<CashSessionDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_current_cash_session()) }
#[tauri::command] pub fn open_cash_session(state: State<'_, AppState>, opening_amount_cents: i64, password: String) -> AppResult<CashSessionDto> {
    {
        let db = db(&state)?;
        let verify_started = Instant::now();
        crate::commands::system::require_master_password(&db, &password)?;
        debug_timing("master_password.verify.open_cash", verify_started);
    }
    let action_started = Instant::now();
    let result = with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.open_cash_session(opening_amount_cents));
    debug_timing("protected_action.open_cash", action_started);
    result
}
#[tauri::command] pub fn close_cash_session(state: State<'_, AppState>, reported_amount_cents: i64, password: String) -> AppResult<()> {
    {
        let db = db(&state)?;
        let verify_started = Instant::now();
        crate::commands::system::require_master_password(&db, &password)?;
        debug_timing("master_password.verify.close_cash", verify_started);
    }
    let action_started = Instant::now();
    let result = with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.close_cash_session(reported_amount_cents));
    debug_timing("protected_action.close_cash", action_started);
    result
}
#[tauri::command] pub fn list_cash_sessions(state: State<'_, AppState>) -> AppResult<Vec<CashSessionDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_cash_sessions()) }
#[tauri::command] pub fn create_cash_income(state: State<'_, AppState>, description: String, amount_cents: i64, payment_method: String, reference_id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_cash_income(&description, amount_cents, &payment_method, &reference_id)) }
#[tauri::command] pub fn create_cash_expense(state: State<'_, AppState>, description: String, amount_cents: i64, payment_method: String, reference_id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_cash_expense(&description, amount_cents, &payment_method, &reference_id)) }
#[tauri::command] pub fn create_sale(state: State<'_, AppState>, sale: CreateSaleInput) -> AppResult<SaleResultDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.create_sale(&sale)) }
#[tauri::command] pub fn list_sales(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<Vec<SaleRecordDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_sales(&start_date, &end_date)) }
#[tauri::command] pub fn get_sale(state: State<'_, AppState>, id: String) -> AppResult<Option<SaleRecordDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| Ok(repo.list_sales("2000-01-01", "2999-12-31")?.into_iter().find(|sale| sale.id == id))) }
#[tauri::command] pub fn cancel_sale(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.cancel_sale(&id)) }
#[tauri::command] pub fn list_cash_movements(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<Vec<CashMovementDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_cash_movements(&start_date, &end_date)) }
#[tauri::command] pub fn list_financial_transactions(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<Vec<FinancialTransactionDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_financial_transactions(&start_date, &end_date)) }
#[tauri::command] pub fn list_payables(state: State<'_, AppState>) -> AppResult<Vec<PayableDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_payables()) }
#[tauri::command] pub fn save_payable(state: State<'_, AppState>, payable: PayableInput) -> AppResult<PayableDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.save_payable(&payable)) }
#[tauri::command] pub fn delete_payable(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.delete_payable(&id)) }
#[tauri::command] pub fn mark_payable_as_paid(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.mark_payable_as_paid(&id)) }
#[tauri::command] pub fn list_receivables(state: State<'_, AppState>) -> AppResult<Vec<ReceivableDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.list_receivables()) }
#[tauri::command] pub fn save_receivable(state: State<'_, AppState>, receivable: ReceivableInput) -> AppResult<ReceivableDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.save_receivable(&receivable)) }
#[tauri::command] pub fn delete_receivable(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.delete_receivable(&id)) }
#[tauri::command] pub fn mark_receivable_as_received(state: State<'_, AppState>, id: String) -> AppResult<()> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.mark_receivable_as_received(&id)) }
#[tauri::command] pub fn get_financial_summary(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<FinancialSummaryDto> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_financial_summary(&start_date, &end_date)) }
#[tauri::command] pub fn get_top_selling_categories(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<Vec<TopSellingCategoryDto>> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_top_selling_categories(&start_date, &end_date)) }
#[tauri::command] pub fn get_sales_report(state: State<'_, AppState>, start_date: String, end_date: String, payment_method: Option<String>, customer_id: Option<String>) -> AppResult<Value> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_sales_report(&start_date, &end_date, payment_method.as_deref(), customer_id.as_deref())) }
#[tauri::command] pub fn get_profit_report(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<Value> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_profit_report(&start_date, &end_date)) }
#[tauri::command] pub fn get_stock_report(state: State<'_, AppState>, category_id: Option<String>, supplier_id: Option<String>) -> AppResult<Value> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_stock_report(category_id.as_deref(), supplier_id.as_deref())) }
#[tauri::command] pub fn get_cash_report(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<Value> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_cash_report(&start_date, &end_date)) }
#[tauri::command] pub fn get_customers_report(state: State<'_, AppState>, start_date: String, end_date: String) -> AppResult<Value> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_customers_report(&start_date, &end_date)) }
#[tauri::command] pub fn get_inventory_valuation_report(state: State<'_, AppState>, category_id: Option<String>, supplier_id: Option<String>) -> AppResult<Value> { with_repo!(state, |repo: &mut CommerceRepository<'_>| repo.get_inventory_valuation_report(category_id.as_deref(), supplier_id.as_deref())) }
#[tauri::command] pub fn export_report_csv(_state: State<'_, AppState>, file_path: String, content: String) -> AppResult<String> { ExportService::new().write_to_path(&file_path, &content) }
#[tauri::command] pub fn export_report_json(_state: State<'_, AppState>, file_path: String, content: String) -> AppResult<String> { ExportService::new().write_to_path(&file_path, &content) }

fn ensure_cash_open(repo: &mut CommerceRepository<'_>, message: &str) -> AppResult<()> {
    if repo.get_current_cash_session()?.is_some() {
        Ok(())
    } else {
        Err(AppError::Validation(message.into()))
    }
}

fn debug_timing(label: &str, started: Instant) {
    #[cfg(debug_assertions)]
    eprintln!("{label}: {} ms", started.elapsed().as_millis());
}
