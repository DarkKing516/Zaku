'use client';

import React, { useState } from 'react';
import { Button, Layout, Menu, type MenuProps, theme } from 'antd';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type MenuItem = Required<MenuProps>['items'][number];

const { Header, Sider, Content } = Layout;

const menuItems: MenuItem[] = [
  {
    key: '/home',
    label: <Link href="/home">Inicio</Link>,
    icon: <Icon icon="line-md:home-twotone" width="1.2em" height="1.2em" />,
  },
  {
    key: '/users',
    label: <Link href="/users">Usuarios</Link>,
    icon: <Icon icon="line-md:account" width="1.2em" height="1.2em" />,
  },
];

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const pathname = usePathname();
  const router = useRouter();

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error('Error cerrando sesión:', e);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#fafafa', overflow: 'hidden', position: 'relative' }}>
      {/* Background Decorative Bubbles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-secondary-100/30 rounded-full blur-[100px] pointer-events-none" />

      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        style={{
          background: 'transparent',
          borderRight: '1px solid rgba(0,0,0,0.05)',
          zIndex: 20,
        }}
        className="hidden md:block"
      >
        <div className="flex items-center justify-center py-8 px-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <Icon icon="line-md:star-pulsating-twotone-loop" width="24" height="24" />
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ background: 'transparent', border: 'none' }}
          className="premium-menu"
        />
      </Sider>

      <Layout style={{ background: 'transparent', position: 'relative', zIndex: 10 }}>
        <Header style={{
          padding: '0 24px',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          height: 72,
        }}>
          <Button
            type="text"
            icon={collapsed ? <Icon icon="line-md:menu-unfold-left" /> : <Icon icon="line-md:menu-fold-left" />}
            onClick={handleToggleCollapse}
            style={{ fontSize: '20px', width: 48, height: 48, borderRadius: '12px' }}
            className="hover:bg-zinc-100 flex items-center justify-center"
          />
          <Button
            type="text"
            icon={<Icon icon="line-md:log-out" width="20" height="20" />}
            onClick={handleLogout}
            style={{ borderRadius: '12px' }}
            className="hover:bg-red-50 hover:text-red-500 flex items-center gap-2"
          >
            {!collapsed && 'Cerrar sesión'}
          </Button>
        </Header>
        <Content style={{
          margin: '24px',
          padding: '32px',
          background: 'white',
          borderRadius: '2rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.06)',
          minHeight: 280,
          border: '1px solid rgba(0,0,0,0.03)',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
