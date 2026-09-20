'use client';

import React from 'react';
import { Typography } from 'antd';
import { Icon } from '@iconify/react';

const { Title, Text } = Typography;

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-sm">
          <Icon icon="line-md:home-twotone" width="28" height="28" />
        </div>
        <div>
          <Title level={2} className="!mb-0 !text-zinc-800">Bienvenido a Zaku</Title>
          <Text className="text-zinc-500">Tu plataforma empresarial multi-tenant</Text>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: 'line-md:account', label: 'Usuarios', value: '—', color: 'primary' },
          { icon: 'line-md:document-list', label: 'Módulos', value: '—', color: 'secondary' },
          { icon: 'line-md:confirm-circle-twotone', label: 'Estado', value: 'Activo', color: 'tertiary' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={`absolute -top-6 -right-6 w-20 h-20 bg-${stat.color}-100/40 rounded-full blur-xl group-hover:scale-125 transition-transform`} />
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-3`}>
                <Icon icon={stat.icon} width="20" height="20" />
              </div>
              <Text className="text-zinc-500 text-sm">{stat.label}</Text>
              <Title level={3} className="!mb-0 !mt-1 !text-zinc-800">{stat.value}</Title>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
