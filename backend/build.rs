fn main() {
    // 指定MySQL库的位置
    println!("cargo:rustc-link-search=C:\\Program Files\\MySQL\\MySQL Server 8.0\\lib");
    println!("cargo:rustc-link-search=C:\\Program Files\\MySQL\\MySQL Connector C++ 8.0\\lib64");
    
    // 链接到libmysql.lib
    println!("cargo:rustc-link-lib=mysqlclient");
    
    // 重新运行条件
    println!("cargo:rerun-if-changed=build.rs");
}