'use client';

import { Button, Card, Typography } from 'antd';

export default function HomePage() {
  return (
    <main className="mx-auto mt-16 max-w-2xl px-4">
      <Card>
        <Typography.Title level={2}>Zaku Enterprise Platform</Typography.Title>
        <Typography.Paragraph>
          Base web shell listo para autenticación multi-tenant y consumo de API.
        </Typography.Paragraph>
        <Button type="primary">Comenzar</Button>
      </Card>
    </main>
  );
}
