import api from '../api';

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  orderPrefix: string;
  itemsPerPage: number;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  theme: string;
  currencySymbol: string;
  taxRate: number;
  paymentGateways: string[];
  logLevel: string;
}

// 后端响应类型
interface AdminSettingsResponse {
  site_name: string;
  site_description: string;
  contact_email: string;
  order_prefix: string;
  items_per_page: number;
  allow_registration: boolean;
  maintenance_mode: boolean;
  theme: string;
  currency_symbol: string;
  tax_rate: number;
  payment_gateways: string[];
  log_level: string;
}

// 获取管理员设置
export const getAdminSettings = async (userId: string): Promise<AdminSettings> => {
  try {
    console.log('获取管理员设置，用户ID:', userId);
    
    const response = await api.get<any, AdminSettingsResponse>(`admin/settings/${userId}`);
    
    console.log('获取管理员设置成功:', response);
    
    // 将后端命名转换为前端命名
    return {
      siteName: response.site_name,
      siteDescription: response.site_description,
      contactEmail: response.contact_email,
      orderPrefix: response.order_prefix,
      itemsPerPage: response.items_per_page,
      allowRegistration: response.allow_registration,
      maintenanceMode: response.maintenance_mode,
      theme: response.theme,
      currencySymbol: response.currency_symbol,
      taxRate: response.tax_rate,
      paymentGateways: response.payment_gateways,
      logLevel: response.log_level
    };
  } catch (error) {
    console.error('获取管理员设置失败:', error);
    throw error;
  }
};

// 更新管理员设置
export const updateAdminSettings = async (userId: string, settings: AdminSettings): Promise<AdminSettings> => {
  try {
    console.log('更新管理员设置，用户ID:', userId);
    
    // 将前端命名转换为后端命名
    const requestData = {
      site_name: settings.siteName,
      site_description: settings.siteDescription,
      contact_email: settings.contactEmail,
      order_prefix: settings.orderPrefix,
      items_per_page: settings.itemsPerPage,
      allow_registration: settings.allowRegistration,
      maintenance_mode: settings.maintenanceMode,
      theme: settings.theme,
      currency_symbol: settings.currencySymbol,
      tax_rate: settings.taxRate,
      payment_gateways: settings.paymentGateways,
      log_level: settings.logLevel
    };
    
    const response = await api.put<any, AdminSettingsResponse>(`admin/settings/${userId}`, requestData);
    
    console.log('更新管理员设置成功:', response);
    
    // 将后端命名转换为前端命名
    return {
      siteName: response.site_name,
      siteDescription: response.site_description,
      contactEmail: response.contact_email,
      orderPrefix: response.order_prefix,
      itemsPerPage: response.items_per_page,
      allowRegistration: response.allow_registration,
      maintenanceMode: response.maintenance_mode,
      theme: response.theme,
      currencySymbol: response.currency_symbol,
      taxRate: response.tax_rate,
      paymentGateways: response.payment_gateways,
      logLevel: response.log_level
    };
  } catch (error) {
    console.error('更新管理员设置失败:', error);
    throw error;
  }
};

// 为了向后兼容，也导出adminApi对象
export const adminApi = {
  getAdminSettings,
  updateAdminSettings
}; 