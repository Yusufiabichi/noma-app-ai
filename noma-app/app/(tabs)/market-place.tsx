import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import client from '../../src/api/client';

type Product = {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  unit?: string;
  imageUrl?: string;
  inStock?: boolean;
  stock?: number;
  rating?: number;
};

type CartItem = Product & {
  quantity: number;
};

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Organic NPK Fertilizer',
    description: 'Balanced fertilizer for maize, rice, and vegetables.',
    price: 12500,
    category: 'Fertilizer',
    unit: '25kg bag',
    stock: 18,
    rating: 4.8,
    inStock: true,
  },
  {
    id: '2',
    name: 'Hybrid Maize Seeds',
    description: 'High-yield maize seed suited for mixed weather conditions.',
    price: 6800,
    category: 'Seeds',
    unit: '10kg pack',
    stock: 34,
    rating: 4.6,
    inStock: true,
  },
  {
    id: '3',
    name: 'Knapsack Sprayer',
    description: 'Durable 16L sprayer for pesticides and foliar feeds.',
    price: 22000,
    category: 'Equipment',
    unit: 'per unit',
    stock: 7,
    rating: 4.4,
    inStock: true,
  },
  {
    id: '4',
    name: 'Herbicide Mix',
    description: 'Fast-acting weed control solution for early growth stages.',
    price: 9400,
    category: 'Crop Care',
    unit: '5L can',
    stock: 0,
    rating: 4.2,
    inStock: false,
  },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value || 0);

const normalizeProduct = (product: Record<string, any>, index: number): Product => ({
  id: product.id ?? product._id ?? `product-${index}`,
  name: product.name ?? product.title ?? 'Unnamed Product',
  description: product.description ?? product.summary ?? '',
  price: Number(product.price ?? product.amount ?? 0),
  category: product.category ?? 'General',
  unit: product.unit ?? product.packageSize ?? 'per item',
  imageUrl: product.imageUrl ?? product.image ?? product.thumbnail,
  inStock: product.inStock ?? (product.stock ?? 1) > 0,
  stock: Number(product.stock ?? product.quantity ?? 0),
  rating: Number(product.rating ?? 0),
});

const MarketPlace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchProducts = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await client.get('/products');
      const rawProducts = Array.isArray(response)
        ? response
        : response?.products ?? response?.data ?? [];

      const normalizedProducts = rawProducts.map((item: Record<string, any>, index: number) =>
        normalizeProduct(item, index)
      );

      setProducts(normalizedProducts);
      setErrorMessage('');
      setUsingFallback(false);
    } catch (error) {
      setProducts(FALLBACK_PRODUCTS);
      setUsingFallback(true);
      setErrorMessage('Unable to load live products right now. Showing available catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = products
      .map((product) => product.category || 'General')
      .filter(Boolean);

    return ['All', ...Array.from(new Set(uniqueCategories))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || (product.category || 'General') === selectedCategory;

      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.unit,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = query.length === 0 || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (product: Product) => {
    if (product.inStock === false || product.stock === 0) {
      Alert.alert('Out of stock', 'This product is currently unavailable.');
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const checkout = async () => {
    if (!cart.length) {
      Alert.alert('Cart is empty', 'Add at least one product before checking out.');
      return;
    }

    setCheckoutLoading(true);

    try {
      await client.post('/checkout', {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      setCart([]);
      Alert.alert('Checkout complete', 'Your order has been placed successfully.');
    } catch (error) {
      Alert.alert(
        'Checkout unavailable',
        'We could not complete checkout right now. Please try again shortly.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const stockLabel =
      item.inStock === false || item.stock === 0
        ? 'Out of stock'
        : item.stock && item.stock > 0
          ? `${item.stock} left`
          : 'In stock';

    return (
      <View style={styles.productCard}>
        <View style={styles.productTopRow}>
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>{item.category || 'General'}</Text>
          </View>
          <View style={styles.ratingBox}>
            <Feather name="star" size={14} color="#D97706" />
            <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
          </View>
        </View>

        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description || 'No description available.'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.productUnit}>{item.unit || 'per item'}</Text>
          <Text
            style={[
              styles.stockText,
              item.inStock === false || item.stock === 0 ? styles.stockOut : styles.stockIn,
            ]}
          >
            {stockLabel}
          </Text>
        </View>

        <View style={styles.productBottomRow}>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              (item.inStock === false || item.stock === 0) && styles.addButtonDisabled,
            ]}
            disabled={item.inStock === false || item.stock === 0}
            onPress={() => addToCart(item)}
          >
            <FontAwesome5 name="cart-plus" size={14} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Market Place</Text>
                <Text style={styles.heroSubtitle}>
                  Browse farm inputs, compare options, and build your order in one place.
                </Text>
              </View>
              <View style={styles.cartPill}>
                <FontAwesome5 name="shopping-basket" size={16} color="#16A34A" />
                <Text style={styles.cartPillText}>{cartCount} items</Text>
              </View>
            </View>

            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="#6B7280" />
              <TextInput
                placeholder="Search products, categories, or size"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {categories.map((category) => {
                const isActive = category === selectedCategory;

                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {(errorMessage || usingFallback) && (
              <View style={styles.noticeCard}>
                <Feather name="info" size={16} color="#92400E" />
                <Text style={styles.noticeText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.resultsRow}>
              <Text style={styles.resultsText}>
                {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} available
              </Text>
              <Text style={styles.resultsSubtext}>Cart total: {formatPrice(cartTotal)}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="package" size={28} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Try a different keyword or change the selected filter.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProducts(true)}
            tintColor="#16A34A"
          />
        }
      />

      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutLabel}>Total</Text>
          <Text style={styles.checkoutAmount}>{formatPrice(cartTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, (!cartCount || checkoutLoading) && styles.checkoutDisabled]}
          disabled={!cartCount || checkoutLoading}
          onPress={checkout}
        >
          <Text style={styles.checkoutButtonText}>
            {checkoutLoading ? 'Processing...' : 'Checkout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFFB',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#4B5563',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingBottom: 0,
  },
  heroCard: {
    backgroundColor: '#16A34A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroTextWrap: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#E8FCEB',
    fontSize: 14,
    lineHeight: 20,
  },
  cartPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cartPillText: {
    marginLeft: 8,
    color: '#166534',
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#111827',
    fontSize: 14,
  },
  filterRow: {
    paddingBottom: 8,
  },
  filterChip: {
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#16A34A',
  },
  filterChipText: {
    color: '#374151',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  noticeCard: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeText: {
    marginLeft: 8,
    color: '#92400E',
    flex: 1,
    fontSize: 13,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  resultsSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  productBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratingText: {
    marginLeft: 5,
    color: '#92400E',
    fontWeight: '600',
    fontSize: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  productDescription: {
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  productUnit: {
    color: '#6B7280',
    fontSize: 13,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stockIn: {
    color: '#15803D',
  },
  stockOut: {
    color: '#DC2626',
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
  checkoutBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  checkoutAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  checkoutButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  checkoutDisabled: {
    backgroundColor: '#6B7280',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default MarketPlace;