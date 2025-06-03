// @generated automatically by Diesel CLI.

diesel::table! {
    users (id) {
        id -> Varchar,
        email -> Varchar,
        password_hash -> Varchar,
        role -> Varchar,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    user_profiles (id) {
        id -> Varchar,
        user_id -> Varchar,
        username -> Nullable<Varchar>,
        phone -> Nullable<Varchar>,
        address -> Nullable<Text>,
        avatar_url -> Nullable<Varchar>,
        gender -> Nullable<Varchar>,
        birth_date -> Nullable<Date>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    admin_profiles (id) {
        id -> Varchar,
        admin_id -> Varchar,
        site_name -> Varchar,
        site_description -> Text,
        contact_email -> Varchar,
        order_prefix -> Varchar,
        items_per_page -> Integer,
        allow_registration -> Bool,
        maintenance_mode -> Bool,
        theme -> Varchar,
        currency_symbol -> Varchar,
        tax_rate -> Double,
        payment_gateways -> Text,
        log_level -> Varchar,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    vendor_profiles (id) {
        id -> Varchar,
        vendor_id -> Varchar,
        store_name -> Nullable<Varchar>,
        store_description -> Nullable<Text>,
        contact_email -> Nullable<Varchar>,
        contact_phone -> Nullable<Varchar>,
        store_address -> Nullable<Text>,
        store_logo_url -> Nullable<Varchar>,
        store_banner_url -> Nullable<Varchar>,
        business_hours -> Nullable<Varchar>,
        accepts_returns -> diesel::sql_types::Bool,
        return_policy -> Nullable<Text>,
        shipping_methods -> Nullable<Text>,
        payment_methods -> Nullable<Text>,
        notification_settings -> Nullable<Text>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    products (id) {
        id -> Varchar,
        name -> Varchar,
        description -> Text,
        price -> Double,
        vendor_id -> Varchar,
        stock -> Integer,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        category -> Nullable<Varchar>,
    }
}

diesel::table! {
    orders (id) {
        id -> Varchar,
        user_id -> Varchar,
        total -> Double,
        status -> Varchar,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    order_items (id) {
        id -> Varchar,
        order_id -> Varchar,
        product_id -> Varchar,
        quantity -> Integer,
        price -> Double,
    }
}

diesel::table! {
    cart_items (id) {
        id -> Varchar,
        user_id -> Varchar,
        product_id -> Varchar,
        quantity -> Integer,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    favorites (id) {
        id -> Varchar,
        user_id -> Varchar,
        product_id -> Varchar,
        created_at -> Timestamp,
    }
}

diesel::joinable!(user_profiles -> users (user_id));
diesel::joinable!(admin_profiles -> users (admin_id));
diesel::joinable!(vendor_profiles -> users (vendor_id));
diesel::joinable!(products -> users (vendor_id));
diesel::joinable!(orders -> users (user_id));
diesel::joinable!(order_items -> orders (order_id));
diesel::joinable!(order_items -> products (product_id));
diesel::joinable!(cart_items -> users (user_id));
diesel::joinable!(cart_items -> products (product_id));
diesel::joinable!(favorites -> users (user_id));
diesel::joinable!(favorites -> products (product_id));

diesel::allow_tables_to_appear_in_same_query!(
    users,
    user_profiles,
    admin_profiles,
    vendor_profiles,
    products,
    orders,
    order_items,
    cart_items,
    favorites,
); 