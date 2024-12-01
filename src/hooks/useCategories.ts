import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Building2, Car, Globe, Hammer, Home, Package, User, Wallet } from 'lucide-react';
import { CategoryCardType } from '../types';
import React from 'react';

const iconMap: { [key: string]: React.ElementType } = {
  Car,
  User,
  Building2,
  Wallet,
  Home,
  Hammer,
  Globe,
  Package
};

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const q = query(collection(db, 'categories'));
      let initialLoad = true;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setCategories(prev => {
            const updatedCategories = [...prev];
            let hasChanges = false;
          
            snapshot.docChanges().forEach(change => {
              const data = change.doc.data();
              const IconComponent = iconMap[data.icon] || Home;
            
              const categoryData: CategoryCardType = {
                id: change.doc.id,
                title: data.title,
                amount: data.amount,
                icon: React.createElement(IconComponent, { 
                  size: 24,
                  className: "text-white"
                }),
                iconName: data.icon,
                color: data.color || 'bg-emerald-500',
                row: parseInt(data.row) || 1,
                isVisible: data.isVisible !== undefined ? data.isVisible : true
              };

              const index = updatedCategories.findIndex(cat => cat.id === categoryData.id);

              if (change.type === 'added' && index === -1) {
                updatedCategories.push(categoryData);
                hasChanges = true;
              } else if (change.type === 'modified' && index !== -1) {
                // Проверяем, действительно ли изменились данные
                if (JSON.stringify(updatedCategories[index]) !== JSON.stringify(categoryData)) {
                updatedCategories[index] = categoryData;
                  hasChanges = true;
                }
              } else if (change.type === 'removed' && index !== -1) {
                updatedCategories.splice(index, 1);
                hasChanges = true;
              }
            });

            // Возвращаем новый массив только если были изменения или это первая загрузка
            if (hasChanges || initialLoad) {
              initialLoad = false;
              return [...updatedCategories].sort((a, b) => (a.row || 0) - (b.row || 0));
            }
            return prev;
          });
          setLoading(false);
        },
        (error) => {
          console.error('Categories subscription error:', error);
          setError('Ошибка получения данных');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error in useCategories:', error);
      setError('Ошибка при инициализации подписки');
      setLoading(false);
      return () => {};
    }
  }, []);

  return { categories, loading, error };
};