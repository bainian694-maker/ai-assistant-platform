import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'ai_assistant',
});

const nodes = [
  {
    name: '美国高速节点-01',
    region: 'US-East',
    configUrl: 'vless://8888-9999-0000@us-east.node.com:443?type=grpc#A_US_East_01',
    maxUsers: 3,
    currentUsers: 1,
    status: 'online',
  },
  {
    name: '日本专线-02',
    region: 'JP-Tokyo',
    configUrl: 'vless://1111-2222-3333@jp-tokyo.node.com:443?type=grpc#A_JP_Tokyo_02',
    maxUsers: 3,
    currentUsers: 3,
    status: 'full',
  },
  {
    name: '新加坡节点-03',
    region: 'SG-Singapore',
    configUrl: 'vless://4444-5555-6666@sg-sg.node.com:443?type=grpc#A_SG_Singapore_03',
    maxUsers: 3,
    currentUsers: 0,
    status: 'online',
  },
];

try {
  for (const node of nodes) {
    await connection.execute(
      'INSERT INTO vpn_nodes (name, region, configUrl, maxUsers, currentUsers, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE currentUsers = ?',
      [node.name, node.region, node.configUrl, node.maxUsers, node.currentUsers, node.status, node.currentUsers]
    );
  }
  console.log('VPN nodes seeded successfully');
  process.exit(0);
} catch (error) {
  console.error('Error seeding VPN nodes:', error);
  process.exit(1);
} finally {
  await connection.end();
}
