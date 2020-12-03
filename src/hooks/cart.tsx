import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const itemExists = products.find(item => item.id === product.id);

      if (itemExists) {
        setProducts(
          products.map(item =>
            item.id === product.id
              ? { ...product, quantity: item.quantity + 1 }
              : item,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const incrementProducts = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );

      setProducts(incrementProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const decrementProduct = products.find(item => item.id === id);

      if (decrementProduct && decrementProduct.quantity > 1) {
        const decrementProducts = products.map(item =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        );
        setProducts(decrementProducts);
      } else {
        const decrementProducts = products.filter(item => item.id !== id);
        setProducts(decrementProducts);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
