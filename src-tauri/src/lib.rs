mod app_state;
mod commands;
mod database;
mod error;
mod repositories;
mod services;

use app_state::AppState;
use database::connection::open_database;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let database = open_database()?;
            app.manage(AppState::new(database));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::system_health,
            commands::system::app_version,
            commands::system::offline_status,
            commands::system::create_backup,
            commands::system::list_backups,
            commands::system::restore_backup,
            commands::system::create_database_backup,
            commands::system::list_database_backups,
            commands::system::restore_database_backup,
            commands::system::delete_database_backup,
            commands::system::get_backup_status,
            commands::system::is_master_password_configured,
            commands::system::set_master_password,
            commands::system::verify_master_password,
            commands::system::factory_reset,
            commands::ui::open_external_url,
            commands::ui::save_store_logo,
            commands::commerce::get_store_settings,
            commands::commerce::update_store_settings,
            commands::commerce::list_customers,
            commands::commerce::get_customer,
            commands::commerce::create_customer,
            commands::commerce::update_customer,
            commands::commerce::deactivate_customer,
            commands::commerce::list_product_categories,
            commands::commerce::create_product_category,
            commands::commerce::update_product_category,
            commands::commerce::deactivate_product_category,
            commands::commerce::list_suppliers,
            commands::commerce::create_supplier,
            commands::commerce::update_supplier,
            commands::commerce::deactivate_supplier,
            commands::commerce::list_financial_goals,
            commands::commerce::save_financial_goal,
            commands::commerce::list_products,
            commands::commerce::get_product,
            commands::commerce::generate_product_sku,
            commands::commerce::create_product,
            commands::commerce::update_product,
            commands::commerce::deactivate_product,
            commands::commerce::import_products,
            commands::commerce::list_stock_movements,
            commands::commerce::create_stock_entry,
            commands::commerce::create_stock_adjustment,
            commands::commerce::get_low_stock_products,
            commands::commerce::get_out_of_stock_products,
            commands::commerce::get_current_cash_session,
            commands::commerce::open_cash_session,
            commands::commerce::close_cash_session,
            commands::commerce::list_cash_sessions,
            commands::commerce::create_cash_income,
            commands::commerce::create_cash_expense,
            commands::commerce::create_sale,
            commands::commerce::list_sales,
            commands::commerce::get_sale,
            commands::commerce::cancel_sale,
            commands::commerce::list_cash_movements,
            commands::commerce::list_financial_transactions,
            commands::commerce::list_payables,
            commands::commerce::save_payable,
            commands::commerce::delete_payable,
            commands::commerce::mark_payable_as_paid,
            commands::commerce::list_receivables,
            commands::commerce::save_receivable,
            commands::commerce::delete_receivable,
            commands::commerce::mark_receivable_as_received,
            commands::commerce::get_financial_summary,
            commands::commerce::get_top_selling_categories,
            commands::commerce::get_sales_report,
            commands::commerce::get_profit_report,
            commands::commerce::get_stock_report,
            commands::commerce::get_cash_report,
            commands::commerce::get_customers_report,
            commands::commerce::get_inventory_valuation_report,
            commands::commerce::export_report_csv,
            commands::commerce::export_report_json,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run LingoMotos");
}
