'use client';
import type { ReactNode } from 'react';
import { App, ConfigProvider, theme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './admin.css';

// Scoped to admin routes: the supporter builder owns its own design system.
export default function AdminProvider({ children }: { children: ReactNode }) {
  return <AntdRegistry><ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: {
    colorPrimary: '#da362e', colorInfo: '#da362e', colorBgBase: '#0c0e0d',
    colorBgContainer: '#171a18', colorBgElevated: '#202421', colorText: '#f3f1ea',
    colorTextSecondary: '#b9bcb2', colorTextTertiary: '#b9bcb2', colorTextDescription: '#b9bcb2', colorBorder: '#555d56', borderRadius: 8,
    motion: false, fontFamily: "Barlow, 'Helvetica Neue', sans-serif", fontSize: 16, controlHeight: 44,
  }, components: { Tabs: { itemSelectedColor: '#ffffff', itemHoverColor: '#ffffff' }, Button: { primaryColor: '#ffffff', colorPrimary: '#da362e', colorPrimaryHover: '#c22e27', colorPrimaryActive: '#b3261e' } } }}><App className="admin-app">{children}</App></ConfigProvider></AntdRegistry>;
}
