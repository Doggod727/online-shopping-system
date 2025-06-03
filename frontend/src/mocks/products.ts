import { Product, ProductsResponse } from '../types/product';

// 电子产品类别
const electronicsProducts: Product[] = [
  {
    id: '1',
    name: '高性能游戏笔记本电脑',
    description: '搭载最新英特尔i9处理器和RTX 4080显卡，32GB内存，1TB SSD，17.3英寸240Hz显示屏，RGB键盘。',
    price: 12999.0,
    stock: 50,
    in_stock: true,
    category: '电子产品',
    vendor_id: '1',
    created_at: '2023-05-15T10:30:00Z',
    updated_at: '2023-05-15T10:30:00Z',
    rating: 4.8,
    rating_count: 120
  },
  {
    id: '2',
    name: '专业摄影相机',
    description: '全画幅无反相机，4500万像素，8K视频录制，5轴防抖，双卡槽，防尘防水。',
    price: 15999.0,
    stock: 30,
    in_stock: true,
    category: '电子产品',
    vendor_id: '1',
    created_at: '2023-05-14T09:20:00Z',
    updated_at: '2023-05-14T09:20:00Z',
    rating: 4.9,
    rating_count: 85
  },
  {
    id: '3',
    name: '智能手表Pro',
    description: '健康监测，心率，血氧，ECG，GPS，50米防水，长达14天续航，多种运动模式。',
    price: 2499.0,
    stock: 100,
    in_stock: true,
    category: '电子产品',
    vendor_id: '1',
    created_at: '2023-05-13T14:45:00Z',
    updated_at: '2023-05-13T14:45:00Z',
    rating: 4.7,
    rating_count: 210
  },
  {
    id: '4',
    name: '无线降噪耳机',
    description: '主动降噪技术，40小时续航，蓝牙5.3，LDAC高解析音频，触控操作。',
    price: 1299.0,
    stock: 150,
    in_stock: true,
    category: '电子产品',
    vendor_id: '1',
    created_at: '2023-05-12T11:10:00Z',
    updated_at: '2023-05-12T11:10:00Z',
    rating: 4.6,
    rating_count: 150
  },
  {
    id: '5',
    name: '超薄智能手机',
    description: '6.7英寸AMOLED屏幕，骁龙8 Gen 2处理器，50MP主摄，5000mAh电池，120W快充。',
    price: 5999.0,
    stock: 200,
    in_stock: true,
    category: '电子产品',
    vendor_id: '1',
    created_at: '2023-05-11T16:30:00Z',
    updated_at: '2023-05-11T16:30:00Z',
    rating: 4.5,
    rating_count: 95
  }
];

// 服装类别
const clothingProducts: Product[] = [
  {
    id: '6',
    name: '男士商务西装',
    description: '意大利进口面料，修身剪裁，深蓝色，适合正式场合和商务活动。',
    price: 1999.0,
    stock: 30,
    in_stock: true,
    category: '服装',
    vendor_id: '1',
    created_at: '2023-05-10T13:25:00Z',
    updated_at: '2023-05-10T13:25:00Z',
    rating: 4.4,
    rating_count: 78
  },
  {
    id: '7',
    name: '女士真丝连衣裙',
    description: '100%桑蚕丝面料，A字版型，优雅大方，多色可选。',
    price: 1299.0,
    stock: 50,
    in_stock: true,
    category: '服装',
    vendor_id: '1',
    created_at: '2023-05-09T10:15:00Z',
    updated_at: '2023-05-09T10:15:00Z',
    rating: 4.7,
    rating_count: 45
  },
  {
    id: '8',
    name: '运动套装',
    description: '速干面料，透气舒适，弹性好，适合健身跑步等运动。',
    price: 399.0,
    stock: 100,
    in_stock: true,
    category: '服装',
    vendor_id: '1',
    created_at: '2023-05-08T09:00:00Z',
    updated_at: '2023-05-08T09:00:00Z',
    rating: 4.3,
    rating_count: 120
  },
  {
    id: '9',
    name: '羊毛大衣',
    description: '90%羊毛成分，保暖挺括，经典双排扣设计，多色可选。',
    price: 1599.0,
    stock: 40,
    in_stock: true,
    category: '服装',
    vendor_id: '1',
    created_at: '2023-05-07T15:30:00Z',
    updated_at: '2023-05-07T15:30:00Z',
    rating: 4.6,
    rating_count: 65
  },
  {
    id: '10',
    name: '牛仔裤',
    description: '高弹力面料，修身显瘦，多种洗水工艺，百搭款式。',
    price: 299.0,
    stock: 150,
    in_stock: true,
    category: '服装',
    vendor_id: '1',
    created_at: '2023-05-06T14:20:00Z',
    updated_at: '2023-05-06T14:20:00Z',
    rating: 4.2,
    rating_count: 180
  }
];

// 家居类别
const homeProducts: Product[] = [
  {
    id: '11',
    name: '北欧风格沙发',
    description: '实木框架，高弹海绵，亚麻面料，三人座，附赠抱枕。',
    price: 3999.0,
    stock: 20,
    in_stock: true,
    category: '家居',
    vendor_id: '1',
    created_at: '2023-05-05T11:10:00Z',
    updated_at: '2023-05-05T11:10:00Z',
    rating: 4.8,
    rating_count: 35
  },
  {
    id: '12',
    name: '实木餐桌椅组合',
    description: '北美白橡木，环保油漆，一桌六椅，适合6-8人用餐。',
    price: 5999.0,
    stock: 15,
    in_stock: true,
    category: '家居',
    vendor_id: '1',
    created_at: '2023-05-04T10:05:00Z',
    updated_at: '2023-05-04T10:05:00Z',
    rating: 4.9,
    rating_count: 28
  },
  {
    id: '13',
    name: '天然乳胶床垫',
    description: '泰国进口乳胶，透气抗菌，7区支撑，两面可用。',
    price: 4999.0,
    stock: 30,
    in_stock: true,
    category: '家居',
    vendor_id: '1',
    created_at: '2023-05-03T09:15:00Z',
    updated_at: '2023-05-03T09:15:00Z',
    rating: 4.7,
    rating_count: 42
  },
  {
    id: '14',
    name: '埃及长绒棉四件套',
    description: '60支埃及长绒棉，柔软亲肤，多色可选，AB版设计。',
    price: 999.0,
    stock: 50,
    in_stock: true,
    category: '家居',
    vendor_id: '1',
    created_at: '2023-05-02T14:30:00Z',
    updated_at: '2023-05-02T14:30:00Z',
    rating: 4.6,
    rating_count: 75
  },
  {
    id: '15',
    name: '智能马桶',
    description: '即热式，自动冲水，暖风烘干，夜灯，除臭功能。',
    price: 2999.0,
    stock: 25,
    in_stock: true,
    category: '家居',
    vendor_id: '1',
    created_at: '2023-05-01T13:25:00Z',
    updated_at: '2023-05-01T13:25:00Z',
    rating: 4.5,
    rating_count: 55
  }
];

// 食品类别
const foodProducts: Product[] = [
  {
    id: '16',
    name: '有机蔬菜礼盒',
    description: '无农药，绿色种植，含10种时令蔬菜，定期配送。',
    price: 199.0,
    stock: 100,
    in_stock: true,
    category: '食品',
    vendor_id: '1',
    created_at: '2023-04-30T10:20:00Z',
    updated_at: '2023-04-30T10:20:00Z',
    rating: 4.8,
    rating_count: 90
  },
  {
    id: '17',
    name: '进口牛排套装',
    description: '澳洲和牛，M5级别，含眼肉，西冷，菲力各2块，真空包装。',
    price: 599.0,
    stock: 50,
    in_stock: true,
    category: '食品',
    vendor_id: '1',
    created_at: '2023-04-29T09:15:00Z',
    updated_at: '2023-04-29T09:15:00Z',
    rating: 4.9,
    rating_count: 65
  },
  {
    id: '18',
    name: '法国红酒礼盒',
    description: '波尔多产区，2015年份，750ml*2瓶，含高档酒具。',
    price: 999.0,
    stock: 30,
    in_stock: true,
    category: '食品',
    vendor_id: '1',
    created_at: '2023-04-28T14:30:00Z',
    updated_at: '2023-04-28T14:30:00Z',
    rating: 4.7,
    rating_count: 45
  },
  {
    id: '19',
    name: '坚果礼盒',
    description: '含夏威夷果，开心果，腰果，杏仁等，无添加，零添加糖。',
    price: 299.0,
    stock: 80,
    in_stock: true,
    category: '食品',
    vendor_id: '1',
    created_at: '2023-04-27T11:20:00Z',
    updated_at: '2023-04-27T11:20:00Z',
    rating: 4.6,
    rating_count: 85
  },
  {
    id: '20',
    name: '特级初榨橄榄油',
    description: '意大利进口，冷压榨取，500ml，适合凉拌和烹饪。',
    price: 199.0,
    stock: 60,
    in_stock: true,
    category: '食品',
    vendor_id: '1',
    created_at: '2023-04-26T10:15:00Z',
    updated_at: '2023-04-26T10:15:00Z',
    rating: 4.5,
    rating_count: 70
  }
];

// 美妆类别
const beautyProducts: Product[] = [
  {
    id: '21',
    name: '高端护肤套装',
    description: '含精华液，面霜，爽肤水，洁面乳，适合干性肌肤。',
    price: 1299.0,
    stock: 40,
    in_stock: true,
    category: '美妆',
    vendor_id: '1',
    created_at: '2023-04-25T09:10:00Z',
    updated_at: '2023-04-25T09:10:00Z',
    rating: 4.8,
    rating_count: 60
  },
  {
    id: '22',
    name: '法国香水',
    description: '东方花香调，持久留香，100ml，礼盒包装。',
    price: 899.0,
    stock: 50,
    in_stock: true,
    category: '美妆',
    vendor_id: '1',
    created_at: '2023-04-24T14:20:00Z',
    updated_at: '2023-04-24T14:20:00Z',
    rating: 4.7,
    rating_count: 55
  },
  {
    id: '23',
    name: '专业彩妆盘',
    description: '含40色眼影，4色腮红，4色高光，专业彩妆师推荐。',
    price: 499.0,
    stock: 60,
    in_stock: true,
    category: '美妆',
    vendor_id: '1',
    created_at: '2023-04-23T11:30:00Z',
    updated_at: '2023-04-23T11:30:00Z',
    rating: 4.6,
    rating_count: 75
  },
  {
    id: '24',
    name: '韩国面膜套装',
    description: '补水保湿，美白淡斑，紧致提拉，30片装。',
    price: 299.0,
    stock: 100,
    in_stock: true,
    category: '美妆',
    vendor_id: '1',
    created_at: '2023-04-22T10:15:00Z',
    updated_at: '2023-04-22T10:15:00Z',
    rating: 4.5,
    rating_count: 90
  },
  {
    id: '25',
    name: '天然有机洗发水',
    description: '无硅油，无添加，滋养发根，500ml。',
    price: 199.0,
    stock: 80,
    in_stock: true,
    category: '美妆',
    vendor_id: '1',
    created_at: '2023-04-21T09:20:00Z',
    updated_at: '2023-04-21T09:20:00Z',
    rating: 4.4,
    rating_count: 65
  }
];

// 合并所有产品
export const mockProducts: Product[] = [
  ...electronicsProducts,
  ...clothingProducts,
  ...homeProducts,
  ...foodProducts,
  ...beautyProducts
];

// 获取所有模拟产品
export const getMockProducts = (
  filters?: {
    page?: number;
    limit?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
  }
): ProductsResponse => {
  // 合并所有产品数据
  let allProducts = [
    ...electronicsProducts,
    ...clothingProducts,
    ...homeProducts,
    ...foodProducts,
    ...beautyProducts,
  ];
  
  // 应用筛选条件
  if (filters) {
    // 分类筛选
    if (filters.category) {
      allProducts = allProducts.filter(
        (product) => product.category === filters.category
      );
    }
    
    // 价格筛选
    if (filters.minPrice !== undefined) {
      allProducts = allProducts.filter(
        (product) => product.price >= filters.minPrice!
      );
    }
    
    if (filters.maxPrice !== undefined) {
      allProducts = allProducts.filter(
        (product) => product.price <= filters.maxPrice!
      );
    }
    
    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      allProducts = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          (product.category && product.category.toLowerCase().includes(searchLower))
      );
    }
    
    // 排序
    if (filters.sortBy) {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      
      switch (filters.sortBy) {
        case 'price':
          allProducts.sort((a, b) => (a.price - b.price) * direction);
          break;
        case 'name':
          allProducts.sort((a, b) => a.name.localeCompare(b.name) * direction);
          break;
        case 'created_at':
          allProducts.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return (dateA - dateB) * direction;
          });
          break;
        default:
          break;
      }
    }
  }
  
  // 计算总数
  const total = allProducts.length;
  
  // 分页
  const page = filters?.page || 1;
  const limit = filters?.limit || 12;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = allProducts.slice(startIndex, endIndex);
  
  return {
    products: paginatedProducts,
    total,
  };
};

// 通过ID获取产品
export const getMockProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id);
};

// 获取供应商的产品
export const getMockProductsByVendorId = (vendorId: string): Product[] => {
  return mockProducts.filter(product => product.vendor_id === vendorId);
}; 