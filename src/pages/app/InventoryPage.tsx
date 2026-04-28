import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Input, Space, Tag, Modal, Form, 
  Select, InputNumber, notification, Typography, Tabs, 
  Statistic, Row, Col, Empty, Badge
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, Package, 
  ArrowUpRight, ArrowDownRight, History, 
  FilterOutlined, AlertTriangle, Database
} from 'lucide-react';
import { api } from '../../lib/api';
import type { MsRepuesto, MsInventarioMovimiento } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const InventoryPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<MsRepuesto[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<MsRepuesto | null>(null);
  const [movements, setMovements] = useState<MsInventarioMovimiento[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  
  const [form] = Form.useForm();
  const [movementForm] = Form.useForm();
  const { profile } = useAuth();

  const fetchParts = async () => {
    setLoading(true);
    const { data, error } = await api.inventory.getParts();
    if (error) {
      notification.error({ message: 'Error al cargar repuestos', description: error });
    } else {
      setParts(data || []);
    }
    setLoading(false);
  };

  const fetchMovements = async (partId: string) => {
    setMovementsLoading(true);
    const { data, error } = await api.inventory.getMovements(partId);
    if (error) {
      notification.error({ message: 'Error al cargar movimientos', description: error });
    } else {
      setMovements(data || []);
    }
    setMovementsLoading(false);
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleCreatePart = async (values: any) => {
    const { data, error } = await api.inventory.createPart(values);
    if (error) {
      notification.error({ message: 'Error al crear repuesto', description: error });
    } else {
      notification.success({ message: 'Repuesto creado correctamente' });
      setIsPartModalOpen(false);
      form.resetFields();
      fetchParts();
    }
  };

  const handleRecordMovement = async (values: any) => {
    if (!selectedPart) return;
    
    const { error } = await api.inventory.recordMovement({
      ...values,
      repuesto_id: selectedPart.id,
      usuario_id: profile?.id
    });

    if (error) {
      notification.error({ message: 'Error al registrar movimiento', description: error });
    } else {
      notification.success({ message: 'Movimiento registrado correctamente' });
      setIsMovementModalOpen(false);
      movementForm.resetFields();
      fetchParts();
      if (selectedPart) fetchMovements(selectedPart.id);
    }
  };

  const filteredParts = parts.filter(p => 
    p.nombre.toLowerCase().includes(searchText.toLowerCase()) || 
    p.codigo.toLowerCase().includes(searchText.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (text: string) => <Text copyable strong>{text}</Text>
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (cat: string) => <Tag color="blue">{cat || 'Sin categoría'}</Tag>
    },
    {
      title: 'Stock Actual',
      dataIndex: 'stock_actual',
      key: 'stock_actual',
      render: (stock: number, record: MsRepuesto) => (
        <Space>
          <Text style={{ color: stock <= record.stock_minimo ? '#ff4d4f' : 'inherit' }} strong>
            {stock} {record.uom}
          </Text>
          {stock <= record.stock_minimo && (
            <AlertTriangle size={14} style={{ color: '#ff4d4f' }} />
          )}
        </Space>
      )
    },
    {
      title: 'Ubicación',
      dataIndex: 'ubicacion',
      key: 'ubicacion',
      render: (u: string) => u || '-'
    },
    {
      title: 'Costo Unit.',
      dataIndex: 'costo_unitario',
      key: 'costo_unitario',
      render: (cost: number) => `$${cost.toFixed(2)}`
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: MsRepuesto) => (
        <Space>
          <Button 
            icon={<PlusOutlined size={14} />} 
            onClick={() => {
              setSelectedPart(record);
              setIsMovementModalOpen(true);
            }}
          >
            Movimiento
          </Button>
          <Button 
            icon={<History size={14} />}
            onClick={() => {
              setSelectedPart(record);
              fetchMovements(record.id);
            }}
          >
            Historial
          </Button>
        </Space>
      )
    }
  ];

  const movementColumns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha_movimiento',
      key: 'fecha_movimiento',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => {
        const colors = { entrada: 'green', salida: 'red', ajuste: 'orange' };
        const icons = { 
          entrada: <ArrowDownRight size={14} />, 
          salida: <ArrowUpRight size={14} />, 
          ajuste: <FilterOutlined size={14} /> 
        };
        return (
          <Tag color={colors[tipo as keyof typeof colors]} icon={icons[tipo as keyof typeof icons]}>
            {tipo.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (val: number, record: any) => (
        <Text strong style={{ color: record.tipo === 'salida' ? '#ff4d4f' : (record.tipo === 'entrada' ? '#52c41a' : 'inherit') }}>
          {record.tipo === 'salida' ? '-' : '+'}{val}
        </Text>
      )
    },
    {
      title: 'Ref',
      dataIndex: 'referencia_tipo',
      key: 'referencia',
      render: (type: string, record: any) => record.referencia_id ? `${type}: ${record.referencia_id}` : '-'
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario_nombre',
      key: 'usuario',
    }
  ];

  const lowStockCount = parts.filter(p => p.stock_actual <= p.stock_minimo).length;
  const totalValue = parts.reduce((acc, p) => acc + (p.stock_actual * p.costo_unitario), 0);

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="stats-card">
            <Statistic 
              title="Total Repuestos" 
              value={parts.length} 
              prefix={<Package size={20} style={{ marginRight: '8px' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="stats-card">
            <Statistic 
              title="Stock Bajo" 
              value={lowStockCount} 
              valueStyle={{ color: lowStockCount > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<AlertTriangle size={20} style={{ marginRight: '8px' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="stats-card">
            <Statistic 
              title="Valor de Inventario" 
              value={totalValue} 
              precision={2}
              prefix={<span style={{ marginRight: '8px' }}>$</span>} 
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>Gestión de Inventarios</Title>
          <Space>
            <Input 
              placeholder="Buscar por nombre o código..." 
              prefix={<SearchOutlined size={16} />} 
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined size={16} />} 
              onClick={() => setIsPartModalOpen(true)}
            >
              Nuevo Repuesto
            </Button>
          </Space>
        </div>

        <Tabs defaultActiveKey="1">
          <TabPane tab={<span><Database size={16} style={{ marginRight: 8 }} />Stock Actual</span>} key="1">
            <Table 
              columns={columns} 
              dataSource={filteredParts} 
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane 
            tab={
              <Badge count={movements.length > 0 && selectedPart ? 0 : 0} dot>
                <span><History size={16} style={{ marginRight: 8 }} />Historial de Movimientos</span>
              </Badge>
            } 
            key="2"
            disabled={!selectedPart}
          >
            {selectedPart ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Title level={5}>Historial: {selectedPart.nombre} ({selectedPart.codigo})</Title>
                  <Button onClick={() => setSelectedPart(null)}>Cerrar Historial</Button>
                </div>
                <Table 
                  columns={movementColumns} 
                  dataSource={movements} 
                  loading={movementsLoading}
                  rowKey="id"
                  size="small"
                />
              </div>
            ) : (
              <Empty description="Seleccione un repuesto para ver su historial" />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal Nuevo Repuesto */}
      <Modal
        title="Crear Nuevo Repuesto"
        open={isPartModalOpen}
        onCancel={() => setIsPartModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePart}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
                <Input placeholder="RP-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoria" label="Categoría">
                <Select placeholder="Seleccionar">
                  <Select.Option value="Mecánico">Mecánico</Select.Option>
                  <Select.Option value="Eléctrico">Eléctrico</Select.Option>
                  <Select.Option value="Lubricantes">Lubricantes</Select.Option>
                  <Select.Option value="Filtros">Filtros</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="uom" label="Unidad de Medida" initialValue="unidades">
                <Input placeholder="unidades, metros, litros..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ubicacion" label="Ubicación en Almacén">
                <Input placeholder="Estante A-1" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stock_minimo" label="Stock Mínimo" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="costo_unitario" label="Costo Unitario ($)" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Registrar Movimiento */}
      <Modal
        title={`Registrar Movimiento: ${selectedPart?.nombre}`}
        open={isMovementModalOpen}
        onCancel={() => setIsMovementModalOpen(false)}
        onOk={() => movementForm.submit()}
      >
        <Form form={movementForm} layout="vertical" onFinish={handleRecordMovement}>
          <Form.Item name="tipo" label="Tipo de Movimiento" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="entrada">Entrada (Compra/Retorno)</Select.Option>
              <Select.Option value="salida">Salida (Consumo OT)</Select.Option>
              <Select.Option value="ajuste">Ajuste de Inventario</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="cantidad" label="Cantidad" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="referencia_tipo" label="Tipo de Referencia">
                <Select placeholder="Opcional">
                  <Select.Option value="OT">Orden de Trabajo</Select.Option>
                  <Select.Option value="OC">Orden de Compra</Select.Option>
                  <Select.Option value="INV">Inventario Inicial</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="referencia_id" label="ID de Referencia">
                <Input placeholder="Código OT/Factura" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notas" label="Notas/Observaciones">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
