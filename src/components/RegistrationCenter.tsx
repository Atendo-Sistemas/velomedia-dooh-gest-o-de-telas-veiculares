import React, { useState } from 'react';
import { 
  Users, 
  Tv, 
  Briefcase, 
  ShieldCheck, 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Smartphone, 
  Car, 
  QrCode, 
  Sparkles, 
  DollarSign, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Award, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  ExternalLink,
  Shield,
  Key,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Compass,
  Target,
  Cpu,
  Wifi,
  Monitor,
  HardDrive,
  Globe,
  Loader2,
  Sliders,
  FileText,
  Maximize2,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Driver, 
  Device, 
  AdvertiserAccount, 
  SaaSUser, 
  SaaSOrganization, 
  SaaSPlan, 
  ScreenPosition, 
  DeviceHardwareOwnership,
  SaaSUserRole,
  CampaignCategory,
  SaaSPlanTier,
  DeviceHardwareSpecs
} from '../types';
import { 
  getAllCities, 
  findCityData, 
  registerCustomCity, 
  geocodeCityOnline,
  searchCitySuggestions 
} from '../data/geographicPoles';
import { DriverWorkAreaModal } from './DriverWorkAreaModal';

export const HARDWARE_PRESETS = [
  {
    id: 'samsung_a9_plus',
    label: 'Samsung Galaxy Tab A9+ 11" 4G/5G (Padrão Frota & BYOD)',
    brand: 'Samsung',
    tabletModel: 'Galaxy Tab A9+ 5G/4G (SM-X216B)',
    screenSizeInches: 11.0,
    resolution: '1920x1200 FHD+ 90Hz',
    panelType: 'TFT LCD Touchscreen 90Hz Anti-Glare (500 nits)',
    brightnessNits: 500,
    aspectRatio: '16:10',
    orientation: 'landscape' as const,
    osVersion: 'Android 14 (One UI 6.1 / Kiosk Lock)',
    connectivity: '5G_M2M' as const,
    simCarrier: 'Claro M2M IoT Enterprise',
    mountType: 'Suporte de Encosto em Alumínio c/ Chave Allen Antifurto',
    powerSupply: '12V Pós-Chave c/ Conversor Step-Down 5V/3A & Temporizador 15min',
    internalStorageGb: 64,
    ramGb: 4,
  },
  {
    id: 'lenovo_m10_plus',
    label: 'Lenovo Tab M10 Plus Gen 3 10.6" 2K (Comodato Premium)',
    brand: 'Lenovo',
    tabletModel: 'Tab M10 Plus (3rd Gen) LTE (TB128XU)',
    screenSizeInches: 10.6,
    resolution: '2000x1200 2K IPS',
    panelType: 'IPS 2K 400 nits 72% NTSC Low Blue Light',
    brightnessNits: 400,
    aspectRatio: '16:10',
    orientation: 'landscape' as const,
    osVersion: 'Android 13 Enterprise',
    connectivity: '4G_LTE_M2M' as const,
    simCarrier: 'TIM Brasil IoT',
    mountType: 'Suporte de Encosto em Alumínio c/ Chave Allen Antifurto',
    powerSupply: '12V Pós-Chave c/ Conversor Step-Down 5V/3A & Temporizador 15min',
    internalStorageGb: 64,
    ramGb: 4,
  },
  {
    id: 'velodooh_pro_10',
    label: 'VeloDOOH Pro Kiosk Ultra-Bright 10.1" (Painel Industrial 550 nits)',
    brand: 'VeloDOOH Systems',
    tabletModel: 'VeloTab Pro 10.1 Commercial Kiosk',
    screenSizeInches: 10.1,
    resolution: '1920x1200 FHD+ IPS',
    panelType: 'IPS Capacitivo 10 Pontos Anti-Reflexo G+G (550 nits)',
    brightnessNits: 550,
    aspectRatio: '16:10',
    orientation: 'landscape' as const,
    osVersion: 'Android 14 (Enterprise Kiosk OS)',
    connectivity: '5G_M2M' as const,
    simCarrier: 'Claro M2M IoT Enterprise',
    mountType: 'Blindagem Veicular em Alumínio c/ Trava de Cabeceira',
    powerSupply: '12V/24V Hardwired Pós-Chave com Filtro de Ruído & Fusível',
    internalStorageGb: 32,
    ramGb: 4,
  },
  {
    id: 'xiaomi_pad_6',
    label: 'Xiaomi Pad 6 11" 144Hz WQHD+ (Alta Performance)',
    brand: 'Xiaomi',
    tabletModel: 'Pad 6 Wi-Fi + Roteador 5G',
    screenSizeInches: 11.0,
    resolution: '2880x1800 WQHD+ 144Hz',
    panelType: 'IPS 1B Colors HDR10 Dolby Vision (550 nits)',
    brightnessNits: 550,
    aspectRatio: '16:10',
    orientation: 'landscape' as const,
    osVersion: 'Android 14 (Xiaomi HyperOS)',
    connectivity: 'WIFI_HOTSPOT' as const,
    simCarrier: 'Roteador Veicular Wi-Fi 6',
    mountType: 'Suporte de Alta Fixação e Garra de Alumínio',
    powerSupply: 'USB-C 33W Fast Charging Veicular',
    internalStorageGb: 128,
    ramGb: 6,
  },
  {
    id: 'multilaser_m10a',
    label: 'Multilaser M10A 4G 10.1" (Econômico / Entrada)',
    brand: 'Multilaser',
    tabletModel: 'M10A 4G LTE',
    screenSizeInches: 10.1,
    resolution: '1280x800 WXGA IPS',
    panelType: 'IPS Capacitivo 350 nits',
    brightnessNits: 350,
    aspectRatio: '16:10',
    orientation: 'landscape' as const,
    osVersion: 'Android 13 Go Edition',
    connectivity: '4G_LTE_M2M' as const,
    simCarrier: 'Vivo Empresas Móvel',
    mountType: 'Suporte Veicular Encosto Padrão',
    powerSupply: 'Adaptador Veicular 12V 5V/2.4A',
    internalStorageGb: 32,
    ramGb: 3,
  },
  {
    id: 'monitor_hdmi_13',
    label: 'Monitor Touchscreen Veicular 13.3" HDMI / Type-C (Grande Formato)',
    brand: 'VeloDisplay Industrial',
    tabletModel: 'VeloScreen 13.3" Pro Car Touch',
    screenSizeInches: 13.3,
    resolution: '1920x1080 Full HD IPS',
    panelType: 'IPS Anti-Reflexo 600 nits High-Bright',
    brightnessNits: 600,
    aspectRatio: '16:9',
    orientation: 'landscape' as const,
    osVersion: 'Linux Embedded DOOH Player v3.2',
    connectivity: '5G_M2M' as const,
    simCarrier: 'Módulo IoT 5G Integrado',
    mountType: 'Braço Articulado em Alumínio Fixado no Trilho do Banco',
    powerSupply: '12V/24V Direto na Bateria c/ Relé Automático',
    internalStorageGb: 64,
    ramGb: 4,
  },
  {
    id: 'custom_manual',
    label: 'Personalizado / Outro Modelo...',
    brand: 'Personalizado',
    tabletModel: 'Modelo Customizado',
    screenSizeInches: 10.1,
    resolution: '1920x1200 FHD+',
    panelType: 'IPS Touch Capacitivo',
    brightnessNits: 500,
    aspectRatio: '16:10',
    orientation: 'landscape' as const,
    osVersion: 'Android 14',
    connectivity: '4G_LTE_M2M' as const,
    simCarrier: 'Operadora M2M',
    mountType: 'Suporte de Encosto Veicular',
    powerSupply: '12V Veicular Pós-Chave',
    internalStorageGb: 32,
    ramGb: 4,
  }
];

interface RegistrationCenterProps {
  drivers: Driver[];
  devices: Device[];
  advertisers: AdvertiserAccount[];
  saasUsers: SaaSUser[];
  organizations: SaaSOrganization[];
  plans: SaaSPlan[];
  currentOrg: SaaSOrganization;
  onSaveDriver: (driver: Driver) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (driverId: string) => void;
  onSaveDevice: (device: Device) => void;
  onUpdateDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: string) => void;
  onSaveAdvertiser: (advertiser: AdvertiserAccount) => void;
  onUpdateAdvertiser: (advertiser: AdvertiserAccount) => void;
  onDeleteAdvertiser: (advertiserId: string) => void;
  onSaveSaaSUser: (user: SaaSUser) => void;
  onUpdateSaaSUser: (user: SaaSUser) => void;
  onDeleteSaaSUser: (userId: string) => void;
  onSaveOrg: (org: SaaSOrganization) => void;
  onUpdateOrg: (org: SaaSOrganization) => void;
  onDeleteOrg: (orgId: string) => void;
  onLaunchPlayerForDevice: (deviceId: string) => void;
  initialTab?: 'drivers' | 'devices' | 'advertisers' | 'users' | 'franchises';
}

export const RegistrationCenter: React.FC<RegistrationCenterProps> = ({
  drivers,
  devices,
  advertisers,
  saasUsers,
  organizations,
  plans,
  currentOrg,
  onSaveDriver,
  onUpdateDriver,
  onDeleteDriver,
  onSaveDevice,
  onUpdateDevice,
  onDeleteDevice,
  onSaveAdvertiser,
  onUpdateAdvertiser,
  onDeleteAdvertiser,
  onSaveSaaSUser,
  onUpdateSaaSUser,
  onDeleteSaaSUser,
  onSaveOrg,
  onUpdateOrg,
  onDeleteOrg,
  onLaunchPlayerForDevice,
  initialTab = 'drivers'
}) => {
  const [activeTab, setActiveTab] = useState<'drivers' | 'devices' | 'advertisers' | 'users' | 'franchises'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal visibility states
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showAdvertiserModal, setShowAdvertiserModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showFranchiseModal, setShowFranchiseModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [selectedDeviceForSpecs, setSelectedDeviceForSpecs] = useState<Device | null>(null);

  // Editing items
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editingAdvertiser, setEditingAdvertiser] = useState<AdvertiserAccount | null>(null);
  const [editingUser, setEditingUser] = useState<SaaSUser | null>(null);
  const [editingOrg, setEditingOrg] = useState<SaaSOrganization | null>(null);

  // Driver Form State
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverCarPlate, setDriverCarPlate] = useState('');
  const [driverCarModel, setDriverCarModel] = useState('');
  const [driverCarColor, setDriverCarColor] = useState('Prata');
  const [driverService, setDriverService] = useState<'Uber Black' | 'Uber Comfort' | 'UberX' | 'Taxi Especial' | '99 Pop'>('Uber Comfort');
  const [driverPixKey, setDriverPixKey] = useState('');
  const [driverContractType, setDriverContractType] = useState<DeviceHardwareOwnership>('driver_byod');
  const [driverDeviceModel, setDriverDeviceModel] = useState('Samsung Galaxy Tab A9+ 11" 4G');
  const [driverReferrerId, setDriverReferrerId] = useState<string>('');
  const [driverWorkingCity, setDriverWorkingCity] = useState('São Paulo');
  const [driverWorkingRegion, setDriverWorkingRegion] = useState('Polo Faria Lima & Itaim Bibi');
  const [driverWorkingRadiusKm, setDriverWorkingRadiusKm] = useState<number>(15);
  const [driverWorkingLat, setDriverWorkingLat] = useState<number>(-23.5855);
  const [driverWorkingLng, setDriverWorkingLng] = useState<number>(-46.6815);
  const [driverForWorkAreaModal, setDriverForWorkAreaModal] = useState<Driver | null>(null);

  // Device Form State
  const [devCode, setDevCode] = useState(`TV-SP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [devSerial, setDevSerial] = useState(`SN-VK${Date.now().toString().slice(-6)}G`);
  const [devModel, setDevModel] = useState('Samsung Galaxy Tab A9+ 11" IPS Kiosk Pro');
  const [devOwnership, setDevOwnership] = useState<DeviceHardwareOwnership>('driver_byod');
  const [devScreenPosition, setDevScreenPosition] = useState<ScreenPosition>('headrest_right');
  const [devDriverId, setDevDriverId] = useState<string>(drivers[0]?.id || '');
  const [devSimIccid, setDevSimIccid] = useState(`8955${Math.floor(100000000000 + Math.random() * 900000000000)}`);
  const [devAutoStart, setDevAutoStart] = useState(true);
  
  // Real Hardware Specs Form State
  const [devHardwarePreset, setDevHardwarePreset] = useState<string>('samsung_a9_plus');
  const [devBrand, setDevBrand] = useState('Samsung');
  const [devScreenSizeInches, setDevScreenSizeInches] = useState<number>(11.0);
  const [devResolution, setDevResolution] = useState('1920x1200 FHD+ 90Hz');
  const [devPanelType, setDevPanelType] = useState('TFT LCD Touchscreen 90Hz Anti-Glare (500 nits)');
  const [devBrightnessNits, setDevBrightnessNits] = useState<number>(500);
  const [devAspectRatio, setDevAspectRatio] = useState('16:10');
  const [devOrientation, setDevOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [devOsVersion, setDevOsVersion] = useState('Android 14 (One UI 6.1 / Kiosk Lock)');
  const [devMacAddress, setDevMacAddress] = useState('74:D0:2B:9F:8A:12');
  const [devImei, setDevImei] = useState('864920058291048');
  const [devSimCarrier, setDevSimCarrier] = useState('Claro M2M IoT Enterprise');
  const [devConnectivity, setDevConnectivity] = useState<'5G_M2M' | '4G_LTE_M2M' | 'WIFI_HOTSPOT' | 'ETHERNET'>('5G_M2M');
  const [devMountType, setDevMountType] = useState('Suporte de Encosto em Alumínio c/ Chave Allen Antifurto');
  const [devPowerSupply, setDevPowerSupply] = useState('12V Pós-Chave c/ Conversor Step-Down 5V/3A & Temporizador 15min');
  const [devStorageGb, setDevStorageGb] = useState<number>(64);
  const [devRamGb, setDevRamGb] = useState<number>(4);

  // New Custom City Form State
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('SP');
  const [newCityRegion, setNewCityRegion] = useState('');
  const [newCityLat, setNewCityLat] = useState<number>(-20.5386);
  const [newCityLng, setNewCityLng] = useState<number>(-47.4008);
  const [isGeocodingNewCity, setIsGeocodingNewCity] = useState(false);

  // Advertiser Form State
  const [advCompanyName, setAdvCompanyName] = useState('');
  const [advTradeName, setAdvTradeName] = useState('');
  const [advCnpj, setAdvCnpj] = useState('');
  const [advCategory, setAdvCategory] = useState<CampaignCategory>('retail');
  const [advContactName, setAdvContactName] = useState('');
  const [advEmail, setAdvEmail] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advCity, setAdvCity] = useState(currentOrg.city);
  const [advState, setAdvState] = useState(currentOrg.state);
  const [advPaymentTerms, setAdvPaymentTerms] = useState<'prepaid' | 'postpaid_30d' | 'monthly_retainer'>('monthly_retainer');
  const [advCreditLimit, setAdvCreditLimit] = useState<number>(10000);

  // SaaS User Form State
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<SaaSUserRole>('fleet_manager');
  const [userOrgId, setUserOrgId] = useState<string>(currentOrg.id);

  // Franchise Form State
  const [orgName, setOrgName] = useState('');
  const [orgCnpj, setOrgCnpj] = useState('');
  const [orgCity, setOrgCity] = useState('');
  const [orgState, setOrgState] = useState('SP');
  const [orgPlanTier, setOrgPlanTier] = useState<SaaSPlanTier>('pro_fleet');
  const [orgAdminName, setOrgAdminName] = useState('');
  const [orgAdminEmail, setOrgAdminEmail] = useState('');
  const [orgAdminPhone, setOrgAdminPhone] = useState('');
  const [orgMaxScreens, setOrgMaxScreens] = useState<number>(30);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showToast(`${label} copiado para a área de transferência!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Helper to apply preset
  const handleApplyHardwarePreset = (presetId: string) => {
    setDevHardwarePreset(presetId);
    const preset = HARDWARE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setDevBrand(preset.brand);
      setDevModel(preset.tabletModel);
      setDevScreenSizeInches(preset.screenSizeInches);
      setDevResolution(preset.resolution);
      setDevPanelType(preset.panelType);
      setDevBrightnessNits(preset.brightnessNits);
      setDevAspectRatio(preset.aspectRatio);
      setDevOrientation(preset.orientation);
      setDevOsVersion(preset.osVersion);
      setDevConnectivity(preset.connectivity);
      setDevSimCarrier(preset.simCarrier);
      setDevMountType(preset.mountType);
      setDevPowerSupply(preset.powerSupply);
      setDevStorageGb(preset.internalStorageGb);
      setDevRamGb(preset.ramGb);
    }
  };

  // -------------------------------------------------------------
  // OPEN MODAL HANDLERS
  // -------------------------------------------------------------
  const handleOpenNewDriver = () => {
    setEditingDriver(null);
    setDriverName('');
    setDriverPhone('');
    setDriverCarPlate('');
    setDriverCarModel('');
    setDriverCarColor('Prata');
    setDriverService('Uber Comfort');
    setDriverPixKey('');
    setDriverContractType('driver_byod');
    setDriverDeviceModel('Samsung Galaxy Tab A9+ 11" 4G (BYOD)');
    setDriverReferrerId('');
    setDriverWorkingCity(currentOrg.city || 'São Paulo');
    setDriverWorkingRegion('Polo Central / Aeroportos');
    setDriverWorkingRadiusKm(15);
    setDriverWorkingLat(-23.5855);
    setDriverWorkingLng(-46.6815);
    setShowDriverModal(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverName(driver.name);
    setDriverPhone(driver.phone);
    setDriverCarPlate(driver.carPlate);
    setDriverCarModel(driver.carModel);
    setDriverCarColor(driver.carColor || 'Preto');
    setDriverService(driver.serviceType);
    setDriverPixKey(driver.pixKey);
    setDriverContractType(driver.contractType === 'company_equipment' ? 'company_owned' : 'driver_byod');
    setDriverDeviceModel(driver.deviceModelOwned || 'Samsung Galaxy Tab A9+');
    setDriverReferrerId(driver.referredByDriverId || '');
    setDriverWorkingCity(driver.workingCity || currentOrg.city || 'São Paulo');
    setDriverWorkingRegion(driver.workingRegion || 'Polo Central');
    setDriverWorkingRadiusKm(driver.workingRadiusKm || 15);
    setDriverWorkingLat(driver.workingCenter?.lat || -23.5855);
    setDriverWorkingLng(driver.workingCenter?.lng || -46.6815);
    setShowDriverModal(true);
  };

  const handleOpenNewDevice = () => {
    setEditingDevice(null);
    const randCode = `TV-SP-${Math.floor(1000 + Math.random() * 9000)}`;
    const randSerial = `SN-VK${Date.now().toString().slice(-6)}G`;
    setDevCode(randCode);
    setDevSerial(randSerial);
    setDevOwnership('driver_byod');
    setDevScreenPosition('headrest_right');
    setDevDriverId(drivers[0]?.id || '');
    setDevSimIccid(`8955${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    setDevMacAddress(`74:D0:2B:${Math.floor(10+Math.random()*89)}:${Math.floor(10+Math.random()*89)}:${Math.floor(10+Math.random()*89)}`);
    setDevImei(`86492005${Math.floor(1000000 + Math.random() * 9000000)}`);
    handleApplyHardwarePreset('samsung_a9_plus');
    setShowDeviceModal(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setDevCode(device.code);
    setDevSerial(device.serialNumber);
    setDevModel(device.model);
    setDevOwnership(device.hardwareOwnership || 'company_owned');
    setDevScreenPosition(device.screenPosition);
    setDevDriverId(device.driverId);
    
    if (device.hardwareSpecs) {
      setDevBrand(device.hardwareSpecs.brand);
      setDevScreenSizeInches(device.hardwareSpecs.screenSizeInches);
      setDevResolution(device.hardwareSpecs.resolution);
      setDevPanelType(device.hardwareSpecs.panelType);
      setDevBrightnessNits(device.hardwareSpecs.brightnessNits);
      setDevAspectRatio(device.hardwareSpecs.aspectRatio);
      setDevOrientation(device.hardwareSpecs.orientation);
      setDevOsVersion(device.hardwareSpecs.osVersion);
      setDevMacAddress(device.hardwareSpecs.macAddress);
      setDevImei(device.hardwareSpecs.imei);
      setDevSimCarrier(device.hardwareSpecs.simCarrier);
      setDevConnectivity(device.hardwareSpecs.connectivity);
      setDevMountType(device.hardwareSpecs.mountType);
      setDevPowerSupply(device.hardwareSpecs.powerSupply);
      setDevStorageGb(device.hardwareSpecs.internalStorageGb);
      setDevRamGb(device.hardwareSpecs.ramGb);
    }
    setShowDeviceModal(true);
  };

  const handleOpenNewAdvertiser = () => {
    setEditingAdvertiser(null);
    setAdvCompanyName('');
    setAdvTradeName('');
    setAdvCnpj('');
    setAdvCategory('retail');
    setAdvContactName('');
    setAdvEmail('');
    setAdvPhone('');
    setAdvCity(currentOrg.city);
    setAdvState(currentOrg.state);
    setAdvPaymentTerms('monthly_retainer');
    setAdvCreditLimit(15000);
    setShowAdvertiserModal(true);
  };

  const handleEditAdvertiser = (adv: AdvertiserAccount) => {
    setEditingAdvertiser(adv);
    setAdvCompanyName(adv.companyName);
    setAdvTradeName(adv.tradeName);
    setAdvCnpj(adv.cnpj);
    setAdvCategory(adv.category);
    setAdvContactName(adv.contactName);
    setAdvEmail(adv.email);
    setAdvPhone(adv.phone);
    setAdvCity(adv.city);
    setAdvState(adv.state);
    setAdvPaymentTerms(adv.paymentTerms);
    setAdvCreditLimit(adv.creditLimit);
    setShowAdvertiserModal(true);
  };

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUserRole('fleet_manager');
    setUserOrgId(currentOrg.id);
    setShowUserModal(true);
  };

  const handleEditUser = (user: SaaSUser) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPhone(user.phone);
    setUserRole(user.role);
    setUserOrgId(user.organizationId);
    setShowUserModal(true);
  };

  const handleOpenNewFranchise = () => {
    setEditingOrg(null);
    setOrgName('');
    setOrgCnpj('');
    setOrgCity('');
    setOrgState('SP');
    setOrgPlanTier('pro_fleet');
    setOrgAdminName('');
    setOrgAdminEmail('');
    setOrgAdminPhone('');
    setOrgMaxScreens(30);
    setShowFranchiseModal(true);
  };

  const handleEditFranchise = (org: SaaSOrganization) => {
    setEditingOrg(org);
    setOrgName(org.name);
    setOrgCnpj(org.cnpj);
    setOrgCity(org.city);
    setOrgState(org.state);
    setOrgPlanTier(org.planTier);
    setOrgAdminName(org.adminUser?.name || '');
    setOrgAdminEmail(org.adminUser?.email || '');
    setOrgAdminPhone(org.adminUser?.phone || '');
    setOrgMaxScreens(org.maxScreensLimit);
    setShowFranchiseModal(true);
  };

  // -------------------------------------------------------------
  // SAVE FORM HANDLERS
  // -------------------------------------------------------------
  const handleSaveDriverForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverCarPlate) return;

    const isByod = driverContractType === 'driver_byod';

    if (editingDriver) {
      const updated: Driver = {
        ...editingDriver,
        name: driverName,
        phone: driverPhone,
        carPlate: driverCarPlate.toUpperCase(),
        carModel: driverCarModel,
        carColor: driverCarColor,
        serviceType: driverService,
        pixKey: driverPixKey || `${driverPhone.replace(/\D/g, '')}@pix.com.br`,
        contractType: isByod ? 'byod_driver_equipment' : 'company_equipment',
        revenueSharePercent: isByod ? 45 : 20,
        deviceModelOwned: driverDeviceModel,
        referredByDriverId: driverReferrerId || undefined,
        workingCity: driverWorkingCity,
        workingRegion: driverWorkingRegion,
        workingCenter: { lat: Number(driverWorkingLat), lng: Number(driverWorkingLng) },
        workingRadiusKm: Number(driverWorkingRadiusKm),
      };
      onUpdateDriver(updated);
      showToast(`Motorista ${driverName} atualizado com sucesso!`);
    } else {
      const generatedCode = `${driverName.split(' ')[0].toUpperCase()}-${driverCarPlate.slice(0, 3).toUpperCase()}`;
      const newDriver: Driver = {
        id: `drv_${Date.now()}`,
        name: driverName,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone: driverPhone || '(11) 98000-0000',
        rating: 5.0,
        carModel: driverCarModel || 'Veículo Cadastrado',
        carPlate: driverCarPlate.toUpperCase(),
        carColor: driverCarColor,
        serviceType: driverService,
        pixKey: driverPixKey || `${driverPhone.replace(/\D/g, '') || 'pix'}@banco.com.br`,
        totalRidesMonth: 0,
        screenUptimeRating: 100.0,
        monthlyEarnings: 0,
        referralCode: generatedCode,
        referredByDriverId: driverReferrerId || undefined,
        referralsCount: 0,
        referralRecurringBonusMonthly: 0,
        referralTotalEarnedLifetime: 0,
        contractType: isByod ? 'byod_driver_equipment' : 'company_equipment',
        revenueSharePercent: isByod ? 45 : 20,
        deviceModelOwned: isByod ? driverDeviceModel : 'TV Fornecida pela Empresa (Comodato)',
        workingCity: driverWorkingCity,
        workingRegion: driverWorkingRegion,
        workingCenter: { lat: Number(driverWorkingLat), lng: Number(driverWorkingLng) },
        workingRadiusKm: Number(driverWorkingRadiusKm),
      };
      onSaveDriver(newDriver);
      confetti({ particleCount: 60, spread: 70 });
      showToast(`Novo motorista ${driverName} cadastrado com sucesso (${isByod ? 'BYOD 45%' : 'Comodato 20%'}) em ${driverWorkingCity}!`);
    }

    setShowDriverModal(false);
  };

  const handleGeocodeNewCity = async () => {
    if (!newCityName.trim()) return;
    setIsGeocodingNewCity(true);
    try {
      const result = await geocodeCityOnline(newCityName);
      if (result) {
        setNewCityState(result.state || 'BR');
        setNewCityLat(result.lat);
        setNewCityLng(result.lng);
        setNewCityRegion(`Praça de ${result.city}`);
        showToast(`Coordenadas de ${result.city} localizadas: ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`);
      } else {
        showToast('Cidade não localizada automaticamente no geocoder. Defina as coordenadas manualmente.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeocodingNewCity(false);
    }
  };

  const handleSaveCustomCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    const registered = registerCustomCity({
      city: newCityName.trim(),
      state: newCityState.trim() || 'BR',
      lat: Number(newCityLat),
      lng: Number(newCityLng),
      region: newCityRegion.trim() || `Região de ${newCityName.trim()}`,
    });
    setDriverWorkingCity(registered.city);
    setDriverWorkingLat(registered.lat);
    setDriverWorkingLng(registered.lng);
    setDriverWorkingRegion(`Região de ${registered.city}`);
    setShowAddCityModal(false);
    confetti({ particleCount: 50, spread: 60 });
    showToast(`Nova praça "${registered.city} - ${registered.state}" cadastrada e ativada no sistema!`);
    setNewCityName('');
  };

  const handleSaveDeviceForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devCode) return;

    const assignedDriver = drivers.find(d => d.id === devDriverId) || drivers[0];

    const hardwareSpecs: DeviceHardwareSpecs = {
      brand: devBrand,
      tabletModel: devModel,
      screenSizeInches: Number(devScreenSizeInches),
      resolution: devResolution,
      panelType: devPanelType,
      brightnessNits: Number(devBrightnessNits),
      aspectRatio: devAspectRatio,
      orientation: devOrientation,
      osVersion: devOsVersion,
      macAddress: devMacAddress,
      imei: devImei,
      simCarrier: devSimCarrier,
      connectivity: devConnectivity,
      mountType: devMountType,
      powerSupply: devPowerSupply,
      internalStorageGb: Number(devStorageGb),
      ramGb: Number(devRamGb),
    };

    if (editingDevice) {
      const updated: Device = {
        ...editingDevice,
        code: devCode,
        serialNumber: devSerial,
        model: devModel,
        hardwareOwnership: devOwnership,
        screenPosition: devScreenPosition,
        driverId: assignedDriver.id,
        driverName: assignedDriver.name,
        carPlate: assignedDriver.carPlate,
        carModel: assignedDriver.carModel,
        hardwareSpecs,
      };
      onUpdateDevice(updated);
      showToast(`Tela ${devCode} atualizada com especificações técnicas salvas!`);
    } else {
      const newDev: Device = {
        id: `dev_${Date.now()}`,
        code: devCode,
        serialNumber: devSerial,
        model: devModel,
        hardwareOwnership: devOwnership,
        screenPosition: devScreenPosition,
        status: 'online',
        driverId: assignedDriver.id,
        driverName: assignedDriver.name,
        carPlate: assignedDriver.carPlate,
        carModel: assignedDriver.carModel,
        hardwareSpecs,
        currentLocation: {
          lat: currentOrg.mapboxConfig?.centerLat || -23.561684,
          lng: currentOrg.mapboxConfig?.centerLng || -46.655981,
          neighborhood: 'Bela Vista / Av. Paulista',
          city: currentOrg.city,
          address: 'Av. Paulista, 1578',
        },
        telemetry: {
          powerConnected: true,
          batteryLevel: 100,
          batteryVoltage: 13.8,
          cpuTemp: 37.5,
          signalStrength: devConnectivity === '5G_M2M' ? '5G' : '4G_EXCELLENT',
          signalDbm: -65,
          storageFreeGb: Number(devStorageGb) - 5,
          totalStorageGb: Number(devStorageGb),
          currentFps: 60,
          brightness: Math.min(100, Math.round((Number(devBrightnessNits) / 600) * 100)),
          volume: 50,
          appVersion: 'v2.8.4-kiosk-locked',
          lastHeartbeat: 'Agora mesmo',
          kioskLocked: true,
          screenUptimeTodayHours: 0.1,
        },
        offlineQueueCount: 0,
        totalImpressionsToday: 0,
        totalInteractionsToday: 0,
      };
      onSaveDevice(newDev);
      confetti({ particleCount: 50, spread: 60 });
      showToast(`TV Veicular ${devCode} (${devScreenSizeInches}" ${devResolution}) provisionada com sucesso!`);
    }

    setShowDeviceModal(false);
  };

  const handleSaveAdvertiserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advCompanyName) return;

    if (editingAdvertiser) {
      const updated: AdvertiserAccount = {
        ...editingAdvertiser,
        companyName: advCompanyName,
        tradeName: advTradeName || advCompanyName,
        cnpj: advCnpj,
        category: advCategory,
        contactName: advContactName,
        email: advEmail,
        phone: advPhone,
        city: advCity,
        state: advState,
        paymentTerms: advPaymentTerms,
        creditLimit: advCreditLimit,
      };
      onUpdateAdvertiser(updated);
      showToast(`Anunciante ${advCompanyName} atualizado!`);
    } else {
      const generatedCode = `${advCompanyName.replace(/\s+/g, '').slice(0, 4).toUpperCase()}-DOOH-2026`;
      const newAdv: AdvertiserAccount = {
        id: `adv_${Date.now()}`,
        companyName: advCompanyName,
        tradeName: advTradeName || advCompanyName,
        cnpj: advCnpj || '00.000.000/0001-00',
        category: advCategory,
        contactName: advContactName || 'Responsável',
        email: advEmail || 'contato@empresa.com.br',
        phone: advPhone || '(11) 99999-9999',
        billingAddress: `${advCity} - ${advState}`,
        city: advCity,
        state: advState,
        paymentTerms: advPaymentTerms,
        creditLimit: advCreditLimit,
        currentBalance: advCreditLimit,
        status: 'active',
        activeCampaignsCount: 0,
        totalSpent: 0,
        portalAccessCode: generatedCode,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveAdvertiser(newAdv);
      confetti({ particleCount: 50, spread: 60 });
      showToast(`Novo cliente anunciante ${advCompanyName} cadastrado com sucesso!`);
    }

    setShowAdvertiserModal(false);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    const targetOrg = organizations.find(o => o.id === userOrgId) || currentOrg;

    if (editingUser) {
      const updated: SaaSUser = {
        ...editingUser,
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        organizationId: targetOrg.id,
        organizationName: targetOrg.name,
      };
      onUpdateSaaSUser(updated);
      showToast(`Usuário ${userName} atualizado com sucesso!`);
    } else {
      const newUser: SaaSUser = {
        id: `usr_${Date.now()}`,
        name: userName,
        email: userEmail,
        phone: userPhone || '(11) 98000-0000',
        role: userRole,
        organizationId: targetOrg.id,
        organizationName: targetOrg.name,
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Recém convidado',
        permissions: userRole === 'super_admin' ? ['all_access'] : ['manage_devices', 'manage_drivers', 'view_reports']
      };
      onSaveSaaSUser(newUser);
      confetti({ particleCount: 50, spread: 60 });
      showToast(`Usuário ${userName} cadastrado na equipe de ${targetOrg.name}!`);
    }

    setShowUserModal(false);
  };

  const handleSaveFranchiseForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !orgCity) return;

    const plan = plans.find(p => p.id === orgPlanTier) || plans[1];

    if (editingOrg) {
      const updated: SaaSOrganization = {
        ...editingOrg,
        name: orgName,
        cnpj: orgCnpj,
        city: orgCity,
        state: orgState,
        planTier: orgPlanTier,
        maxScreensLimit: orgMaxScreens,
        adminUser: {
          name: orgAdminName || editingOrg.adminUser.name,
          email: orgAdminEmail || editingOrg.adminUser.email,
          phone: orgAdminPhone || editingOrg.adminUser.phone,
        }
      };
      onUpdateOrg(updated);
      showToast(`Franquia ${orgName} atualizada com sucesso!`);
    } else {
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const newOrg: SaaSOrganization = {
        id: `org_${Date.now()}`,
        name: orgName,
        slug: slug || `franquia-${orgCity.toLowerCase()}`,
        cnpj: orgCnpj || '00.000.000/0001-00',
        city: orgCity,
        state: orgState,
        planTier: orgPlanTier,
        activeScreensCount: 0,
        maxScreensLimit: orgMaxScreens || plan.maxScreens,
        activeCampaignsCount: 0,
        maxCampaignsLimit: plan.maxCampaigns,
        activeDriversCount: 0,
        maxDriversLimit: (orgMaxScreens || plan.maxScreens) + 10,
        adminUser: {
          name: orgAdminName || 'Administrador Franqueado',
          email: orgAdminEmail || `admin@${slug}.com.br`,
          phone: orgAdminPhone || '(11) 99999-9999',
        },
        billingEmail: orgAdminEmail || `financeiro@${slug}.com.br`,
        billingCycle: 'monthly',
        nextBillingDate: '2026-10-01',
        monthlySoftwareCost: plan.baseMonthlyFee,
        estimatedGrossAdRevenue: 0,
        driverPayoutTotal: 0,
        netProfit: 0,
        status: 'active',
        mapboxConfig: {
          centerLat: orgState === 'RJ' ? -22.9068 : orgState === 'MG' ? -19.9208 : -23.5505,
          centerLng: orgState === 'RJ' ? -43.1729 : orgState === 'MG' ? -43.9378 : -46.6333,
          defaultZoom: 13,
        }
      };
      onSaveOrg(newOrg);
      confetti({ particleCount: 60, spread: 70 });
      showToast(`Nova Franquia "${orgName}" cadastrada e ativada no ecossistema SaaS!`);
    }

    setShowFranchiseModal(false);
  };

  // -------------------------------------------------------------
  // COUNTERS & KPIS
  // -------------------------------------------------------------
  const totalDrivers = drivers.length;
  const byodDrivers = drivers.filter(d => d.contractType === 'byod_driver_equipment').length;
  const companyDrivers = totalDrivers - byodDrivers;
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const totalAdvertisers = advertisers.length;
  const totalUsers = saasUsers.length;
  const totalOrgs = organizations.length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-tight">Central de Cadastros & Provisionamento</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Módulo 360°
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestão cadastral completa de motoristas, telas veiculares IoT, clientes anunciantes, usuários da equipe e franquias SaaS.
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenNewDriver}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition"
          >
            <Car className="w-3.5 h-3.5" />
            <span>+ Motorista</span>
          </button>

          <button
            onClick={handleOpenNewDevice}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>+ TV / Tela</span>
          </button>

          <button
            onClick={handleOpenNewAdvertiser}
            className="flex items-center space-x-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>+ Anunciante</span>
          </button>

          <button
            onClick={handleOpenNewUser}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>+ Usuário SaaS</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded font-bold">SUCESSO</span>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Card 1: Motoristas */}
        <button
          onClick={() => setActiveTab('drivers')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'drivers' 
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/40' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Motoristas</span>
            <Car className={`w-4 h-4 ${activeTab === 'drivers' ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">{totalDrivers}</div>
          <span className="text-[10px] text-emerald-400/90 font-medium">
            {byodDrivers} BYOD • {companyDrivers} Comodato
          </span>
        </button>

        {/* Card 2: Telas IoT */}
        <button
          onClick={() => setActiveTab('devices')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'devices' 
              ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-950/40' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Telas / TVs</span>
            <Tv className={`w-4 h-4 ${activeTab === 'devices' ? 'text-blue-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">{totalDevices}</div>
          <span className="text-[10px] text-blue-400/90 font-medium">
            {onlineDevices} online ({Math.round((onlineDevices / totalDevices) * 100 || 0)}%)
          </span>
        </button>

        {/* Card 3: Anunciantes */}
        <button
          onClick={() => setActiveTab('advertisers')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'advertisers' 
              ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-950/40' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Anunciantes B2B</span>
            <Briefcase className={`w-4 h-4 ${activeTab === 'advertisers' ? 'text-purple-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">{totalAdvertisers}</div>
          <span className="text-[10px] text-purple-400/90 font-medium">Empresas Parceiras</span>
        </button>

        {/* Card 4: Usuários SaaS */}
        <button
          onClick={() => setActiveTab('users')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'users' 
              ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/40' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Usuários & Equipe</span>
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'users' ? 'text-indigo-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">{totalUsers}</div>
          <span className="text-[10px] text-indigo-400/90 font-medium">Operadores RBAC</span>
        </button>

        {/* Card 5: Franquias */}
        <button
          onClick={() => setActiveTab('franchises')}
          className={`p-3.5 rounded-2xl border text-left transition-all col-span-2 sm:col-span-1 ${
            activeTab === 'franchises' 
              ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-950/40' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Franquias SaaS</span>
            <Building2 className={`w-4 h-4 ${activeTab === 'franchises' ? 'text-cyan-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">{totalOrgs}</div>
          <span className="text-[10px] text-cyan-400/90 font-medium">Cidades Ativas</span>
        </button>

      </div>

      {/* Tabs Switcher and Filter Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('drivers'); setSearchTerm(''); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'drivers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Motoristas ({totalDrivers})</span>
          </button>

          <button
            onClick={() => { setActiveTab('devices'); setSearchTerm(''); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'devices' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Telas Veiculares ({totalDevices})</span>
          </button>

          <button
            onClick={() => { setActiveTab('advertisers'); setSearchTerm(''); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'advertisers' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Anunciantes ({totalAdvertisers})</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Usuários SaaS ({totalUsers})</span>
          </button>

          <button
            onClick={() => { setActiveTab('franchises'); setSearchTerm(''); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'franchises' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Franquias ({totalOrgs})</span>
          </button>
        </div>

        {/* Search input and City Registration Shortcut */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAddCityModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition shadow-sm"
            title="Cadastrar nova cidade fora dos polos padrão"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Cadastrar Praça</span>
          </button>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. ABA: CADASTRO DE MOTORISTAS PARCEIROS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white">Base de Motoristas Parceiros</h2>
              <p className="text-xs text-slate-400">Controle de motoristas ativos, placas, PIX para repasses e modalidade de equipamento (BYOD vs Comodato).</p>
            </div>
            <button
              onClick={handleOpenNewDriver}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Motorista</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Motorista</th>
                    <th className="p-3.5">Veículo & Placa</th>
                    <th className="p-3.5">Praça & Região</th>
                    <th className="p-3.5">Modalidade / Repasse</th>
                    <th className="p-3.5">Chave PIX</th>
                    <th className="p-3.5">Código Indicação</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {drivers
                    .filter(d => 
                      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.carPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.phone.includes(searchTerm) ||
                      (d.workingCity && d.workingCity.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(driver => {
                      const isByod = driver.contractType === 'byod_driver_equipment';
                      return (
                        <tr key={driver.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={driver.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                                alt={driver.name} 
                                className="w-9 h-9 rounded-full object-cover border border-slate-700" 
                              />
                              <div>
                                <span className="font-bold text-white block">{driver.name}</span>
                                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  <span>{driver.phone}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-medium text-slate-200">{driver.carModel}</div>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded text-cyan-300 border border-slate-800">
                                {driver.carPlate}
                              </span>
                              <span className="text-[10px] text-slate-400">({driver.serviceType})</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-1 font-semibold text-white">
                              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <span>{driver.workingCity || 'São Paulo'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px] mt-0.5">
                              {driver.workingRegion || 'Polo Central'} • {driver.workingRadiusKm || 15}km
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isByod 
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}>
                                {isByod ? 'BYOD (45% PIX)' : 'Comodato (20% PIX)'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[140px]">
                              {driver.deviceModelOwned || 'Hardware Padrão'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-[11px] text-emerald-400 block truncate max-w-[160px]">
                              {driver.pixKey}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => copyToClipboard(driver.referralCode, 'Código')}
                              className="font-mono text-[10px] bg-slate-950 hover:bg-slate-800 px-2 py-1 rounded text-purple-300 border border-purple-500/30 flex items-center space-x-1"
                            >
                              <span>{driver.referralCode}</span>
                              <Copy className="w-3 h-3 text-purple-400" />
                            </button>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setDriverForWorkAreaModal(driver)}
                                className="p-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 hover:text-white border border-blue-500/30"
                                title="Configurar Geolocalização e Praça de Trabalho"
                              >
                                <Compass className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditDriver(driver)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Editar Cadastro do Motorista"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja excluir o cadastro de ${driver.name}?`)) {
                                    onDeleteDriver(driver.id);
                                    showToast(`Motorista ${driver.name} removido.`);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                                title="Excluir Motorista"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ABA: CADASTRO DE TELAS VEICULARES & HARDWARE                           */}
      {/* ========================================================================= */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white">Inventário de Telas & TVs Veiculares IoT</h2>
              <p className="text-xs text-slate-400">Equipamentos vinculados a veículos, posição de instalação, status de telemetria e chave de ativação Kiosk.</p>
            </div>
            <button
              onClick={handleOpenNewDevice}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova TV / Tela</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Código / Serial</th>
                    <th className="p-3.5">Hardware / Monitor Real</th>
                    <th className="p-3.5">Conectividade & Rede</th>
                    <th className="p-3.5">Motorista & Veículo</th>
                    <th className="p-3.5">Posição no Carro</th>
                    <th className="p-3.5">Status & Telemetria</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {devices
                    .filter(d => 
                      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.carPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (d.hardwareSpecs?.brand && d.hardwareSpecs.brand.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(device => {
                      const isOnline = device.status === 'online';
                      const specs = device.hardwareSpecs;
                      return (
                        <tr key={device.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              <Tv className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <div>
                                <span className="font-mono font-bold text-white block">{device.code}</span>
                                <span className="font-mono text-[10px] text-slate-500">{device.serialNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{device.model}</span>
                            </div>
                            {specs ? (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                                  {specs.screenSizeInches}" • {specs.resolution}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                                  {specs.brightnessNits} nits
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={specs.panelType}>
                                  {specs.panelType}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 block">
                                {device.hardwareOwnership === 'driver_byod' ? 'BYOD do Motorista' : 'Comodato Empresa'}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-1 text-slate-200">
                              <Wifi className="w-3 h-3 text-cyan-400" />
                              <span className="font-semibold text-[11px]">{specs?.simCarrier || 'Chip M2M IoT'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[130px]" title={specs?.macAddress ? `MAC: ${specs.macAddress}` : ''}>
                              {specs?.macAddress ? `MAC: ${specs.macAddress}` : (device.telemetry?.signalStrength || '5G Online')}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-white block">{device.driverName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{device.carPlate} • {device.carModel}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {device.screenPosition === 'headrest_right' ? 'Encosto Traseiro Dir.' :
                               device.screenPosition === 'headrest_left' ? 'Encosto Traseiro Esq.' :
                               device.screenPosition === 'center_console' ? 'Console Central' : 'Painel Frontal'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                              <span className="font-bold text-[11px] text-white">
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-400">
                                {device.telemetry?.batteryVoltage || '13.8'}V • {device.telemetry?.cpuTemp || '37'}°C
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedDeviceForSpecs(device)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center space-x-1 transition"
                                title="Ver Ficha Técnica Real do Monitor"
                              >
                                <Sliders className="w-3 h-3 text-cyan-400" />
                                <span>Ficha Técnica</span>
                              </button>
                              <button
                                onClick={() => onLaunchPlayerForDevice(device.id)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow transition"
                                title="Abrir Player TV Kiosk"
                              >
                                Testar TV
                              </button>
                              <button
                                onClick={() => handleEditDevice(device)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Editar Cadastro de Tela"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir cadastro da tela ${device.code}?`)) {
                                    onDeleteDevice(device.id);
                                    showToast(`Tela ${device.code} removida.`);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                                title="Excluir Tela"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ABA: CADASTRO DE ANUNCIANTES & CLIENTES B2B                            */}
      {/* ========================================================================= */}
      {activeTab === 'advertisers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white">Empresas Anunciantes & Agências</h2>
              <p className="text-xs text-slate-400">Clientes com acesso ao Portal do Anunciante, controle de saldo/limite e faturamento.</p>
            </div>
            <button
              onClick={handleOpenNewAdvertiser}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Anunciante</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Empresa / Razão Social</th>
                    <th className="p-3.5">CNPJ & Cidade</th>
                    <th className="p-3.5">Segmento</th>
                    <th className="p-3.5">Contato & E-mail</th>
                    <th className="p-3.5">Limite de Crédito</th>
                    <th className="p-3.5">Código do Portal</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {advertisers
                    .filter(a => 
                      a.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.cnpj.includes(searchTerm) ||
                      a.contactName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(adv => (
                      <tr key={adv.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{adv.tradeName}</div>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">{adv.companyName}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[11px] text-slate-300 block">{adv.cnpj}</span>
                          <span className="text-[10px] text-slate-500">{adv.city}/{adv.state}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {adv.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-200">{adv.contactName}</div>
                          <span className="text-[11px] text-slate-400">{adv.email}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-emerald-400">
                            R$ {adv.creditLimit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-slate-500 uppercase">{adv.paymentTerms}</span>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => copyToClipboard(adv.portalAccessCode, 'PIN do Portal')}
                            className="font-mono text-[10px] bg-slate-950 hover:bg-slate-800 px-2 py-1 rounded text-cyan-300 border border-cyan-500/30 flex items-center space-x-1"
                          >
                            <span>{adv.portalAccessCode}</span>
                            <Copy className="w-3 h-3 text-cyan-400" />
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleEditAdvertiser(adv)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Editar Anunciante"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir o cliente ${adv.tradeName}?`)) {
                                  onDeleteAdvertiser(adv.id);
                                  showToast(`Anunciante ${adv.tradeName} excluído.`);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                              title="Excluir Anunciante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ABA: CADASTRO DE USUÁRIOS & EQUIPE SAAS (RBAC)                         */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white">Equipe Operacional & Acesso RBAC</h2>
              <p className="text-xs text-slate-400">Usuários administrativos com controle de papéis (Super Admin, Gestor de Frota, Auditor Financeiro, Moderador).</p>
            </div>
            <button
              onClick={handleOpenNewUser}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Convidar / Novo Usuário</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Nome do Usuário</th>
                    <th className="p-3.5">E-mail & Telefone</th>
                    <th className="p-3.5">Perfil de Acesso (Role)</th>
                    <th className="p-3.5">Franquia Vinculada</th>
                    <th className="p-3.5">Último Acesso</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {saasUsers
                    .filter(u => 
                      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(user => {
                      const getRoleBadge = (role: SaaSUserRole) => {
                        switch (role) {
                          case 'super_admin':
                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Super Admin</span>;
                          case 'fleet_manager':
                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Gestor de Frota</span>;
                          case 'financial_auditor':
                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Auditor Financeiro</span>;
                          case 'ad_reviewer':
                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Moderador de Mídia</span>;
                          default:
                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">Técnico</span>;
                        }
                      };

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                                alt={user.name} 
                                className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                              />
                              <span className="font-bold text-white">{user.name}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-medium text-slate-200">{user.email}</div>
                            <span className="text-[11px] text-slate-400">{user.phone}</span>
                          </td>
                          <td className="p-3.5">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-cyan-300">{user.organizationName}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-[11px] text-slate-400">{user.lastLogin || 'Recente'}</span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Editar Usuário"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover acesso de ${user.name}?`)) {
                                    onDeleteSaaSUser(user.id);
                                    showToast(`Usuário ${user.name} removido.`);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                                title="Remover Usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ABA: CADASTRO DE FRANQUIAS & CIDADES SAAS (MULTI-TENANT)               */}
      {/* ========================================================================= */}
      {activeTab === 'franchises' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white">Franquias & Cidades Licenciadas</h2>
              <p className="text-xs text-slate-400">Tenants independentes do ecossistema SaaS, quotas de telas e faturamento.</p>
            </div>
            <button
              onClick={handleOpenNewFranchise}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Franquia</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Nome da Franquia</th>
                    <th className="p-3.5">CNPJ & Praça</th>
                    <th className="p-3.5">Plano SaaS</th>
                    <th className="p-3.5">Quota de Telas</th>
                    <th className="p-3.5">Administrador Responsável</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {organizations
                    .filter(o => 
                      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      o.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      o.cnpj.includes(searchTerm) ||
                      o.adminUser.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(org => (
                      <tr key={org.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{org.name}</span>
                          <span className="font-mono text-[10px] text-cyan-400">{org.slug}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[11px] text-slate-300 block">{org.cnpj}</span>
                          <span className="text-[10px] text-slate-400">{org.city}/{org.state}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                            {org.planTier.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-white">
                            {org.activeScreensCount} / {org.maxScreensLimit} telas
                          </div>
                          <span className="text-[10px] text-slate-500">
                            R$ {org.monthlySoftwareCost.toFixed(2)}/mês
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-200">{org.adminUser?.name}</div>
                          <span className="text-[11px] text-slate-400">{org.adminUser?.email}</span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleEditFranchise(org)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Editar Franquia"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remover a franquia ${org.name}?`)) {
                                  onDeleteOrg(org.id);
                                  showToast(`Franquia ${org.name} removida.`);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                              title="Excluir Franquia"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CADASTRO / EDIÇÃO DE MOTORISTA                                    */}
      {/* ========================================================================= */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  {editingDriver ? 'Editar Cadastro do Motorista' : 'Cadastrar Novo Motorista Parceiro'}
                </h3>
              </div>
              <button
                onClick={() => setShowDriverModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriverForm} className="space-y-4 text-xs">
              
              {/* Modalidade de Contrato (BYOD vs Comodato) */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  1. Modelo de Contrato & Repasse PIX:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDriverContractType('driver_byod');
                      setDriverDeviceModel('Samsung Galaxy Tab A9+ 11" 4G (BYOD)');
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      driverContractType === 'driver_byod'
                        ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">BYOD (Tablet Próprio)</span>
                      <span className="text-[10px] bg-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-200">45% PIX</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Motorista usa tablet pessoal. Zero custo de hardware.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDriverContractType('company_owned');
                      setDriverDeviceModel('TV Fornecida pela Empresa (Comodato)');
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      driverContractType === 'company_owned'
                        ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">Frota Empresa</span>
                      <span className="text-[10px] bg-cyan-500/30 px-1.5 py-0.5 rounded text-cyan-200">20% PIX</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Hardware fornecido pela franquia em comodato.</p>
                  </button>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98452-1102"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dados do Veículo */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Modelo do Carro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Toyota Corolla Hybrid 2024"
                    value={driverCarModel}
                    onChange={(e) => setDriverCarModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Placa *</label>
                  <input
                    type="text"
                    required
                    placeholder="BRA2E19"
                    value={driverCarPlate}
                    onChange={(e) => setDriverCarPlate(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Categoria & Cor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Categoria de Atuação</label>
                  <select
                    value={driverService}
                    onChange={(e) => setDriverService(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Uber Black">Uber Black</option>
                    <option value="Uber Comfort">Uber Comfort</option>
                    <option value="UberX">UberX</option>
                    <option value="99 Pop">99 Pop</option>
                    <option value="Taxi Especial">Táxi Especial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Cor do Veículo</label>
                  <input
                    type="text"
                    placeholder="Prata Metálico"
                    value={driverCarColor}
                    onChange={(e) => setDriverCarColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Praça de Atuação & Geolocalização Operacional */}
              <div className="p-3.5 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <span>2. Praça & Área de Atuação (Mapbox / GPS):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Geocerca Ativa</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-400 font-medium">Cidade / Praça</label>
                      <button
                        type="button"
                        onClick={() => setShowAddCityModal(true)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Nova Cidade</span>
                      </button>
                    </div>
                    <select
                      value={driverWorkingCity}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        setDriverWorkingCity(newCity);
                        const cityData = findCityData(newCity);
                        if (cityData) {
                          setDriverWorkingLat(cityData.lat);
                          setDriverWorkingLng(cityData.lng);
                          setDriverWorkingRegion(`Região Central de ${cityData.city}`);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      {getAllCities().map(c => (
                        <option key={c.city} value={c.city}>{c.city} - {c.state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                      <span>Raio Operacional</span>
                      <span className="font-mono text-blue-400">{driverWorkingRadiusKm} km</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="50"
                      step="1"
                      value={driverWorkingRadiusKm}
                      onChange={(e) => setDriverWorkingRadiusKm(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer pt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bairro / Polo de Concentração</label>
                  <input
                    type="text"
                    placeholder="Ex: Polo Faria Lima / Aeroporto Congonhas"
                    value={driverWorkingRegion}
                    onChange={(e) => setDriverWorkingRegion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Latitude Base GPS</label>
                    <input
                      type="number"
                      step="any"
                      value={driverWorkingLat}
                      onChange={(e) => setDriverWorkingLat(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Longitude Base GPS</label>
                    <input
                      type="number"
                      step="any"
                      value={driverWorkingLng}
                      onChange={(e) => setDriverWorkingLng(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Chave PIX */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Chave PIX para Repasse de Ganhos *</label>
                <input
                  type="text"
                  placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                  value={driverPixKey}
                  onChange={(e) => setDriverPixKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Padrinho Indicador (Bônus de Indicação) */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Padrinho / Indicado por:</label>
                <select
                  value={driverReferrerId}
                  onChange={(e) => setDriverReferrerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Sem indicação (Cadastro Direto)</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.referralCode}) - {d.carPlate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30"
                >
                  {editingDriver ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CADASTRO / PROVISIONAMENTO DE TV VEICULAR                         */}
      {/* ========================================================================= */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Tv className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {editingDevice ? 'Editar Cadastro de TV' : 'Cadastrar & Parear Nova TV Veicular'}
                </h3>
              </div>
              <button
                onClick={() => setShowDeviceModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeviceForm} className="space-y-4 text-xs">
              
              {/* Presets de Hardware */}
              <div className="p-3 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>1. Preset de Hardware / Modelo Homologado:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Auto-Preenchimento</span>
                </div>
                <select
                  value={devHardwarePreset}
                  onChange={(e) => handleApplyHardwarePreset(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  {HARDWARE_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">Selecione um dos modelos automotivos padrão ou customize as especificações reais abaixo.</p>
              </div>

              {/* Identificação Básica */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Código da Tela (ID) *</label>
                  <input
                    type="text"
                    required
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Número de Série Físico *</label>
                  <input
                    type="text"
                    required
                    value={devSerial}
                    onChange={(e) => setDevSerial(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Ficha Técnica Real do Monitor / Display */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. Especificações Reais do Display & Painel:</span>
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Marca</label>
                    <input
                      type="text"
                      value={devBrand}
                      onChange={(e) => setDevBrand(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-400 font-medium mb-1">Modelo Comercial</label>
                    <input
                      type="text"
                      value={devModel}
                      onChange={(e) => setDevModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Polegadas (")</label>
                    <input
                      type="number"
                      step="0.1"
                      value={devScreenSizeInches}
                      onChange={(e) => setDevScreenSizeInches(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Resolução Nativa</label>
                    <input
                      type="text"
                      placeholder="1920x1200 FHD+"
                      value={devResolution}
                      onChange={(e) => setDevResolution(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Brilho (Nits)</label>
                    <input
                      type="number"
                      value={devBrightnessNits}
                      onChange={(e) => setDevBrightnessNits(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tecnologia do Painel / Vidro</label>
                  <input
                    type="text"
                    placeholder="IPS Touchscreen Capacitivo Anti-Reflexo G+G"
                    value={devPanelType}
                    onChange={(e) => setDevPanelType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Sistema Operacional / Firmware</label>
                    <input
                      type="text"
                      value={devOsVersion}
                      onChange={(e) => setDevOsVersion(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Memória RAM / Armazenamento</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        placeholder="RAM (GB)"
                        value={devRamGb}
                        onChange={(e) => setDevRamGb(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="ROM (GB)"
                        value={devStorageGb}
                        onChange={(e) => setDevStorageGb(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conectividade & Identificação de Rede Real */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Conectividade & Identificação Telemétrica:</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Endereço MAC (Wi-Fi/Eth)</label>
                    <input
                      type="text"
                      value={devMacAddress}
                      onChange={(e) => setDevMacAddress(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-cyan-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">IMEI do Módulo Móvel</label>
                    <input
                      type="text"
                      value={devImei}
                      onChange={(e) => setDevImei(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-cyan-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Chip / Operadora M2M</label>
                    <input
                      type="text"
                      value={devSimCarrier}
                      onChange={(e) => setDevSimCarrier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Tecnologia de Rede</label>
                    <select
                      value={devConnectivity}
                      onChange={(e) => setDevConnectivity(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="5G_M2M">5G Standalone / M2M</option>
                      <option value="4G_LTE_M2M">4G LTE Cat-4 M2M</option>
                      <option value="WIFI_HOTSPOT">Roteador Wi-Fi Veicular</option>
                      <option value="ETHERNET">Ethernet Industrial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fixação & Alimentação */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Suporte de Fixação</label>
                  <input
                    type="text"
                    value={devMountType}
                    onChange={(e) => setDevMountType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Alimentação Elétrica</label>
                  <input
                    type="text"
                    value={devPowerSupply}
                    onChange={(e) => setDevPowerSupply(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-[11px]"
                  />
                </div>
              </div>

              {/* Vínculo de Motorista */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Vincular ao Veículo / Motorista *</label>
                <select
                  value={devDriverId}
                  onChange={(e) => setDevDriverId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.carPlate} ({d.carModel}) - {d.workingCity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Posição no Veículo</label>
                  <select
                    value={devScreenPosition}
                    onChange={(e) => setDevScreenPosition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="headrest_right">Encosto Traseiro Direito</option>
                    <option value="headrest_left">Encosto Traseiro Esquerdo</option>
                    <option value="center_console">Console Central</option>
                    <option value="dashboard">Painel Frontal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Propriedade do Hardware</label>
                  <select
                    value={devOwnership}
                    onChange={(e) => setDevOwnership(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="driver_byod">BYOD (Do Motorista - 45%)</option>
                    <option value="company_owned">Comodato da Empresa (20%)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Auto-Start Kiosk no Boot</span>
                  <span className="text-[10px] text-slate-400">Abrir Player TV automaticamente ao ligar a ignição do veículo</span>
                </div>
                <input
                  type="checkbox"
                  checked={devAutoStart}
                  onChange={(e) => setDevAutoStart(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30"
                >
                  {editingDevice ? 'Salvar Alterações' : 'Provisionar TV'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CADASTRO / EDIÇÃO DE ANUNCIANTE B2B                               */}
      {/* ========================================================================= */}
      {showAdvertiserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">
                  {editingAdvertiser ? 'Editar Anunciante' : 'Cadastrar Novo Anunciante / Agência'}
                </h3>
              </div>
              <button
                onClick={() => setShowAdvertiserModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvertiserForm} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Starbucks Brasil"
                    value={advTradeName}
                    onChange={(e) => setAdvTradeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SouthRock Alimentos S.A."
                    value={advCompanyName}
                    onChange={(e) => setAdvCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">CNPJ / CPF *</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={advCnpj}
                    onChange={(e) => setAdvCnpj(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Segmento / Categoria</label>
                  <select
                    value={advCategory}
                    onChange={(e) => setAdvCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="retail">Varejo / E-commerce</option>
                    <option value="food_beverage">Gastronomia / Alimentos</option>
                    <option value="tech_finance">Fintech & Bancos</option>
                    <option value="automotive">Automotivo</option>
                    <option value="health">Saúde & Bem-Estar</option>
                    <option value="entertainment">Entretenimento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Contato / Responsável</label>
                  <input
                    type="text"
                    placeholder="Nome do Gestor de Mídia"
                    value={advContactName}
                    onChange={(e) => setAdvContactName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">E-mail Financeiro *</label>
                  <input
                    type="email"
                    required
                    placeholder="anuncios@empresa.com.br"
                    value={advEmail}
                    onChange={(e) => setAdvEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Condição de Pagamento</label>
                  <select
                    value={advPaymentTerms}
                    onChange={(e) => setAdvPaymentTerms(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="monthly_retainer">Mensalidade Recorrente</option>
                    <option value="prepaid">Créditos Pré-Pagos</option>
                    <option value="postpaid_30d">Faturado 30 Dias (Pós)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Limite de Crédito Inicial (R$)</label>
                  <input
                    type="number"
                    value={advCreditLimit}
                    onChange={(e) => setAdvCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdvertiserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30"
                >
                  {editingAdvertiser ? 'Salvar Alterações' : 'Cadastrar Anunciante'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CADASTRO / EDIÇÃO DE USUÁRIO SAAS                                */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  {editingUser ? 'Editar Usuário da Equipe' : 'Convidar Novo Operador / Usuário SaaS'}
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carolina Mendes"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@velomedia.com.br"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 99182-3401"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Cargo / Papel RBAC</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="super_admin">Super Administrador SaaS</option>
                    <option value="fleet_manager">Gestor de Frota & Telas</option>
                    <option value="financial_auditor">Auditor Financeiro / PoP</option>
                    <option value="ad_reviewer">Moderador de Campanhas</option>
                    <option value="support_tech">Técnico de Suporte IoT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Franquia Vinculada</label>
                  <select
                    value={userOrgId}
                    onChange={(e) => setUserOrgId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-slate-400 text-[11px]">
                <span className="font-bold text-indigo-300 block">Permissões automáticas concedidas:</span>
                <span>• Acesso ao painel de controle operacional</span>
                <span className="block">• Notificações de telemetria e alertas em tempo real</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30"
                >
                  {editingUser ? 'Salvar Alterações' : 'Convidar Usuário'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CADASTRO / EDIÇÃO DE FRANQUIA SAAS                                */}
      {/* ========================================================================= */}
      {showFranchiseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  {editingOrg ? 'Editar Franquia SaaS' : 'Cadastrar Nova Franquia / Cidade Tenant'}
                </h3>
              </div>
              <button
                onClick={() => setShowFranchiseModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFranchiseForm} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nome da Franquia / Operação *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: VeloMedia Curitiba & Região"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Cidade Sede *</label>
                  <input
                    type="text"
                    required
                    placeholder="Curitiba"
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="PR"
                    value={orgState}
                    onChange={(e) => setOrgState(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Plano SaaS Licenciado</label>
                  <select
                    value={orgPlanTier}
                    onChange={(e) => setOrgPlanTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="starter">Starter (Até 5 Telas)</option>
                    <option value="pro_fleet">Pro Fleet (Até 30 Telas)</option>
                    <option value="enterprise_network">Enterprise (Telas Ilimitadas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Limite Máximo de Telas</label>
                  <input
                    type="number"
                    value={orgMaxScreens}
                    onChange={(e) => setOrgMaxScreens(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Nome do Franqueado</label>
                  <input
                    type="text"
                    placeholder="Administrador Local"
                    value={orgAdminName}
                    onChange={(e) => setOrgAdminName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">E-mail do Franqueado</label>
                  <input
                    type="email"
                    placeholder="franqueado@cidade.com.br"
                    value={orgAdminEmail}
                    onChange={(e) => setOrgAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFranchiseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/30"
                >
                  {editingOrg ? 'Salvar Franquia' : 'Ativar Franquia'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CONFIGURAÇÃO DE GEOLOCALIZAÇÃO & PRAÇA OPERACIONAL               */}
      {/* ========================================================================= */}
      {driverForWorkAreaModal && (
        <DriverWorkAreaModal
          driver={driverForWorkAreaModal}
          onClose={() => setDriverForWorkAreaModal(null)}
          onSaveWorkArea={(driverId, config) => {
            const updated: Driver = {
              ...driverForWorkAreaModal,
              workingCity: config.workingCity,
              workingRegion: config.workingRegion,
              workingCenter: config.workingCenter,
              workingRadiusKm: config.workingRadiusKm,
              workingPoles: config.workingPoles,
            };
            onUpdateDriver(updated);
            showToast(`Praça e geocercas do motorista ${driverForWorkAreaModal.name} salvas com sucesso!`);
            setDriverForWorkAreaModal(null);
          }}
          onSave={(config) => {
            const updated: Driver = {
              ...driverForWorkAreaModal,
              workingCity: config.workingCity,
              workingRegion: config.workingRegion,
              workingCenter: config.workingCenter,
              workingRadiusKm: config.workingRadiusKm,
              workingPoles: config.workingPoles,
            };
            onUpdateDriver(updated);
            showToast(`Praça e geocercas do motorista ${driverForWorkAreaModal.name} salvas com sucesso!`);
            setDriverForWorkAreaModal(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: FICHA TÉCNICA REAL DO MONITOR / DISPOSITIVO                      */}
      {/* ========================================================================= */}
      {selectedDeviceForSpecs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Ficha Técnica Real do Hardware</h3>
                  <p className="text-xs text-slate-400">Especificações do display, modem, firmware e telemetria da tela {selectedDeviceForSpecs.code}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeviceForSpecs(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Header Info */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-cyan-400 text-sm block">{selectedDeviceForSpecs.code}</span>
                  <span className="text-slate-300 font-semibold">{selectedDeviceForSpecs.model}</span>
                  <span className="text-slate-500 block text-[11px]">S/N: {selectedDeviceForSpecs.serialNumber}</span>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    selectedDeviceForSpecs.status === 'online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedDeviceForSpecs.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{selectedDeviceForSpecs.status === 'online' ? 'ONLINE • TRANSMITINDO' : 'OFFLINE'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Motorista: {selectedDeviceForSpecs.driverName} ({selectedDeviceForSpecs.carPlate})
                  </span>
                </div>
              </div>

              {/* Hardware Display Specs */}
              {selectedDeviceForSpecs.hardwareSpecs ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Tamanho do Display</span>
                    <span className="text-white font-bold text-sm">{selectedDeviceForSpecs.hardwareSpecs.screenSizeInches} Polegadas</span>
                    <span className="text-slate-400 block text-[10px]">{selectedDeviceForSpecs.hardwareSpecs.aspectRatio || '16:10'} • {selectedDeviceForSpecs.hardwareSpecs.orientation || 'Landscape'}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Resolução Nativa</span>
                    <span className="text-cyan-400 font-mono font-bold text-sm">{selectedDeviceForSpecs.hardwareSpecs.resolution}</span>
                    <span className="text-slate-400 block text-[10px]">Taxa: {selectedDeviceForSpecs.hardwareSpecs.refreshRateHz || 60}Hz</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Brilho Máximo</span>
                    <span className="text-amber-400 font-mono font-bold text-sm">{selectedDeviceForSpecs.hardwareSpecs.brightnessNits} Nits</span>
                    <span className="text-slate-400 block text-[10px]">Uso sob Luz Solar</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 col-span-2 sm:col-span-3">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Tecnologia do Painel & Toque</span>
                    <span className="text-slate-200 font-medium block">{selectedDeviceForSpecs.hardwareSpecs.panelType}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Sistema / OS</span>
                    <span className="text-slate-200 font-semibold">{selectedDeviceForSpecs.hardwareSpecs.osVersion}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Memória / Storage</span>
                    <span className="text-slate-200 font-mono font-semibold">
                      {selectedDeviceForSpecs.hardwareSpecs.ramGb}GB RAM / {selectedDeviceForSpecs.hardwareSpecs.storageGb}GB ROM
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Conectividade Móvel</span>
                    <span className="text-emerald-400 font-semibold">{selectedDeviceForSpecs.hardwareSpecs.simCarrier}</span>
                    <span className="text-slate-400 block text-[10px] font-mono">{selectedDeviceForSpecs.hardwareSpecs.connectivity}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Endereço MAC</span>
                    <span className="text-cyan-300 font-mono font-bold">{selectedDeviceForSpecs.hardwareSpecs.macAddress || 'N/D'}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 col-span-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">IMEI Módulo Modem</span>
                    <span className="text-cyan-300 font-mono font-bold">{selectedDeviceForSpecs.hardwareSpecs.imei || 'N/D'}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 col-span-2 sm:col-span-3">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Suporte & Alimentação Elétrica</span>
                    <span className="text-slate-300 block">{selectedDeviceForSpecs.hardwareSpecs.mountType} • {selectedDeviceForSpecs.hardwareSpecs.powerSupply}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center text-slate-400">
                  <p>Esta tela utiliza os parâmetros padrão de hardware. Clique em "Editar" para preencher a ficha técnica completa.</p>
                </div>
              )}

              {/* Telemetry Live Data */}
              <div className="p-4 bg-slate-950 border border-cyan-500/20 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Telemetria em Tempo Real (Transmissão Ativa):</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Tensão Bateria</span>
                    <span className="text-emerald-400 font-mono font-bold">{selectedDeviceForSpecs.telemetry?.batteryVoltage || '13.8'} V</span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Temp. CPU</span>
                    <span className="text-amber-400 font-mono font-bold">{selectedDeviceForSpecs.telemetry?.cpuTemp || '38'} °C</span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Sinal 4G/5G</span>
                    <span className="text-cyan-400 font-mono font-bold">{selectedDeviceForSpecs.telemetry?.signalStrength || '-68 dBm'}</span>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Impactos Auditados</span>
                    <span className="text-white font-mono font-bold">{selectedDeviceForSpecs.telemetry?.totalImpressions || 0}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const dev = selectedDeviceForSpecs;
                    setSelectedDeviceForSpecs(null);
                    handleEditDevice(dev);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl font-bold flex items-center space-x-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Ficha Técnica</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeviceForSpecs(null)}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold"
                >
                  Fechar
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: CADASTRO DE NOVA CIDADE / PRAÇA FORA DOS POLOS                   */}
      {/* ========================================================================= */}
      {showAddCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Cadastrar Nova Praça / Cidade</h3>
                  <p className="text-xs text-slate-400">Adicione cidades fora do catálogo padrão para operação imediata</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCityModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Nome da Cidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Londrina, Santos, Campinas"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="PR"
                    value={newCityState}
                    onChange={(e) => setNewCityState(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Região / Macro-Região</label>
                <input
                  type="text"
                  placeholder="Ex: Norte do Paraná / Sul"
                  value={newCityRegion}
                  onChange={(e) => setNewCityRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Coordenadas Geográficas (GPS):</span>
                  <button
                    type="button"
                    disabled={isGeocodingNewCity || !newCityName}
                    onClick={handleGeocodeNewCity}
                    className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold flex items-center space-x-1 disabled:opacity-50 transition"
                  >
                    <Compass className={`w-3 h-3 ${isGeocodingNewCity ? 'animate-spin' : ''}`} />
                    <span>{isGeocodingNewCity ? 'Buscando...' : '⚡ Buscar Coordenadas'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[10px]">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-23.5505"
                      value={newCityLat}
                      onChange={(e) => setNewCityLat(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[10px]">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-46.6333"
                      value={newCityLng}
                      onChange={(e) => setNewCityLng(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCityModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomCity}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/30"
                >
                  Cadastrar & Ativar Praça
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
