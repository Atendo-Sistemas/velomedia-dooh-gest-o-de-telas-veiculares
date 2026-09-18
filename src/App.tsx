import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Navbar, ActiveTab } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { MapboxGeoManager } from './components/MapboxGeoManager';
import { DeviceManager } from './components/DeviceManager';
import { CampaignManager } from './components/CampaignManager';
import { AnalyticsReports } from './components/AnalyticsReports';
import { DriversManager } from './components/DriversManager';
import { SaaSBillingManager } from './components/SaaSBillingManager';
import { SaaSMasterAdmin } from './components/SaaSMasterAdmin';
import { KioskPlayer } from './components/KioskPlayer';
import { ArchitectureDoc } from './components/ArchitectureDoc';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { NewCampaignModal } from './components/NewCampaignModal';
import { PairDeviceModal } from './components/PairDeviceModal';
import { MobileTesterModal } from './components/MobileTesterModal';
import { PwaInstallerModal } from './components/PwaInstallerModal';
import { DriverPortal } from './components/DriverPortal';
import { AdvertiserPortal } from './components/AdvertiserPortal';
import { PassengerPortal } from './components/PassengerPortal';
import { RegistrationCenter } from './components/RegistrationCenter';
import { Campaign, Device, Driver, GeoFence, ProofOfPlayLog, SaaSOrganization, SaaSUser, AdvertiserAccount } from './types';
import { 
  INITIAL_CAMPAIGNS, 
  INITIAL_DEVICES, 
  INITIAL_DRIVERS, 
  INITIAL_GEOFENCES, 
  INITIAL_ORGANIZATIONS,
  SAAS_PLANS,
  INITIAL_INVOICES,
  INITIAL_ADVERTISER_PORTALS,
  INITIAL_SAAS_USERS,
  INITIAL_ADVERTISER_ACCOUNTS
} from './data/mockData';
import { INITIAL_PROOF_OF_PLAY } from './services/telemetryEngine';
import { apiClient } from './services/apiClient';

export default function App() {
  // Read initial tab and kiosk mode from URL (e.g. ?tab=player or ?kiosk=true or ?device=TV-SP-8491)
  const getInitialActiveTab = (): ActiveTab => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const roleParam = params.get('role');

      // URL parameters can select a demo view in development only, never grant authorization
      if (import.meta.env.DEV) {
        if (roleParam === 'driver') return 'driver_portal';
        if (roleParam === 'advertiser') return 'advertiser_portal';
        if (roleParam === 'passenger') return 'passenger_portal';
      }

      if (tabParam === 'player' || params.get('kiosk') === 'true' || params.get('mode') === 'kiosk') {
        return 'player';
      }
      if (
        tabParam === 'registrations' ||
        tabParam === 'mapbox' || 
        tabParam === 'devices' || 
        tabParam === 'campaigns' || 
        tabParam === 'analytics' || 
        tabParam === 'drivers' || 
        tabParam === 'driver_portal' || 
        tabParam === 'advertiser_portal' || 
        tabParam === 'passenger_portal' || 
        tabParam === 'saas' || 
        tabParam === 'architecture'
      ) {
        return tabParam as ActiveTab;
      }
    } catch {
      // ignore
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialActiveTab);
  const [isMasterMode, setIsMasterMode] = useState<boolean>(false);
  
  // Primary persistent state
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [geoFences, setGeoFences] = useState<GeoFence[]>(INITIAL_GEOFENCES);
  const [proofOfPlayLogs, setProofOfPlayLogs] = useState<ProofOfPlayLog[]>(INITIAL_PROOF_OF_PLAY);

  // SaaS multi-tenant state
  const [organizations, setOrganizations] = useState<SaaSOrganization[]>(INITIAL_ORGANIZATIONS);
  const [currentOrgId, setCurrentOrgId] = useState<string>(INITIAL_ORGANIZATIONS[0].id);
  const [saasUsers, setSaasUsers] = useState<SaaSUser[]>(INITIAL_SAAS_USERS);
  const [advertisers, setAdvertisers] = useState<AdvertiserAccount[]>(INITIAL_ADVERTISER_ACCOUNTS);

  const currentOrg = organizations.find(o => o.id === currentOrgId) || organizations[0];

  // Bootstrap live data from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadApiData() {
      try {
        const [orgsRes, devsRes, campsRes, drvsRes, gfsRes, popsRes, advsRes] = await Promise.allSettled([
          apiClient.getOrganizations(),
          apiClient.getDevices(),
          apiClient.getCampaigns(),
          apiClient.getDrivers(),
          apiClient.getGeoFences(),
          apiClient.getProofOfPlayLogs(50),
          apiClient.getAdvertisers(),
        ]);

        if (!isMounted) return;

        if (orgsRes.status === 'fulfilled' && orgsRes.value.length > 0) {
          setOrganizations(orgsRes.value);
        }
        if (devsRes.status === 'fulfilled' && devsRes.value.length > 0) {
          setDevices(devsRes.value);
        }
        if (campsRes.status === 'fulfilled' && campsRes.value.length > 0) {
          setCampaigns(campsRes.value);
        }
        if (drvsRes.status === 'fulfilled' && drvsRes.value.length > 0) {
          setDrivers(drvsRes.value);
        }
        if (gfsRes.status === 'fulfilled' && gfsRes.value.length > 0) {
          setGeoFences(gfsRes.value);
        }
        if (popsRes.status === 'fulfilled' && popsRes.value.length > 0) {
          setProofOfPlayLogs(popsRes.value);
        }
        if (advsRes.status === 'fulfilled' && advsRes.value.length > 0) {
          setAdvertisers(advsRes.value);
        }
      } catch (err) {
        console.info('[VeloMedia] Initializing with default seed state:', err);
      }
    }
    loadApiData();
    return () => { isMounted = false; };
  }, []);

  const [apiError, setApiError] = useState<string | null>(null);

  const handleUpdateOrg = async (updatedOrg: SaaSOrganization) => {
    const previous = [...organizations];
    setOrganizations(organizations.map(o => o.id === updatedOrg.id ? updatedOrg : o));
    try {
      await apiClient.updateOrganization(updatedOrg);
    } catch (err: any) {
      setOrganizations(previous);
      setApiError(`Erro ao atualizar organização: ${err.message || err}`);
    }
  };

  const handleCreateOrg = async (newOrg: SaaSOrganization) => {
    const previous = [...organizations];
    setOrganizations([newOrg, ...organizations]);
    try {
      const saved = await apiClient.saveOrganization(newOrg);
      setOrganizations(prev => [saved, ...prev.filter(o => o.id !== saved.id)]);
    } catch (err: any) {
      setOrganizations(previous);
      setApiError(`Erro ao criar organização: ${err.message || err}`);
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    const previous = [...organizations];
    setOrganizations(organizations.filter(o => o.id !== orgId));
    try {
      await apiClient.deleteOrganization(orgId);
    } catch (err: any) {
      setOrganizations(previous);
      setApiError(`Erro ao remover organização: ${err.message || err}`);
    }
  };

  const handleSwitchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
  };

  // Drivers CRUD
  const handleSaveDriver = async (newDriver: Driver) => {
    const previous = [...drivers];
    setDrivers([newDriver, ...drivers]);
    try {
      const saved = await apiClient.saveDriver(newDriver);
      setDrivers(prev => [saved, ...prev.filter(d => d.id !== saved.id)]);
    } catch (err: any) {
      setDrivers(previous);
      setApiError(`Erro ao salvar motorista: ${err.message || err}`);
    }
  };

  const handleUpdateDriver = async (updatedDriver: Driver) => {
    const previous = [...drivers];
    setDrivers(drivers.map(d => d.id === updatedDriver.id ? updatedDriver : d));
    try {
      const updated = await apiClient.updateDriver(updatedDriver);
      setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (err: any) {
      setDrivers(previous);
      setApiError(`Erro ao atualizar motorista: ${err.message || err}`);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    const previous = [...drivers];
    setDrivers(drivers.filter(d => d.id !== driverId));
    try {
      await apiClient.deleteDriver(driverId);
    } catch (err: any) {
      setDrivers(previous);
      setApiError(`Erro ao excluir motorista: ${err.message || err}`);
    }
  };

  // Devices CRUD
  const handleSaveDevice = async (newDev: Device) => {
    const previous = [...devices];
    setDevices([newDev, ...devices]);
    try {
      const saved = await apiClient.saveDevice(newDev);
      setDevices(prev => [saved, ...prev.filter(d => d.id !== saved.id)]);
    } catch (err: any) {
      setDevices(previous);
      setApiError(`Erro ao registrar dispositivo: ${err.message || err}`);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    const previous = [...devices];
    setDevices(devices.filter(d => d.id !== deviceId));
    try {
      await apiClient.deleteDevice(deviceId);
    } catch (err: any) {
      setDevices(previous);
      setApiError(`Erro ao remover dispositivo: ${err.message || err}`);
    }
  };

  // Advertisers CRUD
  const handleSaveAdvertiser = async (newAdv: AdvertiserAccount) => {
    const previous = [...advertisers];
    setAdvertisers([newAdv, ...advertisers]);
    try {
      const saved = await apiClient.saveAdvertiser(newAdv);
      setAdvertisers(prev => [saved, ...prev.filter(a => a.id !== saved.id)]);
    } catch (err: any) {
      setAdvertisers(previous);
      setApiError(`Erro ao salvar anunciante: ${err.message || err}`);
    }
  };

  const handleUpdateAdvertiser = async (updatedAdv: AdvertiserAccount) => {
    const previous = [...advertisers];
    setAdvertisers(advertisers.map(a => a.id === updatedAdv.id ? updatedAdv : a));
    try {
      const saved = await apiClient.saveAdvertiser(updatedAdv);
      setAdvertisers(prev => prev.map(a => a.id === saved.id ? saved : a));
    } catch (err: any) {
      setAdvertisers(previous);
      setApiError(`Erro ao atualizar anunciante: ${err.message || err}`);
    }
  };

  const handleDeleteAdvertiser = async (advId: string) => {
    const previous = [...advertisers];
    setAdvertisers(advertisers.filter(a => a.id !== advId));
    try {
      await apiClient.deleteAdvertiser(advId);
    } catch (err: any) {
      setAdvertisers(previous);
      setApiError(`Erro ao excluir anunciante: ${err.message || err}`);
    }
  };

  // SaaS Users CRUD
  const handleSaveSaaSUser = (newUser: SaaSUser) => {
    setSaasUsers([newUser, ...saasUsers]);
  };

  const handleUpdateSaaSUser = (updatedUser: SaaSUser) => {
    setSaasUsers(saasUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteSaaSUser = (userId: string) => {
    setSaasUsers(saasUsers.filter(u => u.id !== userId));
  };

  // GeoFence handlers
  const handleAddGeoFence = async (newFence: GeoFence) => {
    const previous = [...geoFences];
    setGeoFences([newFence, ...geoFences]);
    try {
      const saved = await apiClient.saveGeoFence(newFence);
      setGeoFences(prev => [saved, ...prev.filter(f => f.id !== saved.id)]);
    } catch (err: any) {
      setGeoFences(previous);
      setApiError(`Erro ao salvar cerca virtual: ${err.message || err}`);
    }
  };

  const handleUpdateGeoFence = async (updatedFence: GeoFence) => {
    const previous = [...geoFences];
    setGeoFences(geoFences.map(f => f.id === updatedFence.id ? updatedFence : f));
    try {
      await apiClient.saveGeoFence(updatedFence);
    } catch (err: any) {
      setGeoFences(previous);
      setApiError(`Erro ao atualizar cerca virtual: ${err.message || err}`);
    }
  };

  const handleDeleteGeoFence = async (fenceId: string) => {
    const previous = [...geoFences];
    setGeoFences(geoFences.filter(f => f.id !== fenceId));
    try {
      await apiClient.deleteGeoFence(fenceId);
    } catch (err: any) {
      setGeoFences(previous);
      setApiError(`Erro ao remover cerca virtual: ${err.message || err}`);
    }
  };

  // Active player device selection
  const getInitialPlayerDeviceId = (): string => {
    try {
      const params = new URLSearchParams(window.location.search);
      const devCode = params.get('device');
      if (devCode) {
        const found = INITIAL_DEVICES.find(d => d.code === devCode || d.id === devCode);
        if (found) return found.id;
      }
    } catch {
      // ignore
    }
    return INITIAL_DEVICES[0].id;
  };

  const [activePlayerDeviceId, setActivePlayerDeviceId] = useState<string>(getInitialPlayerDeviceId);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Modals state
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<Device | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState<boolean>(false);
  const [showPairDeviceModal, setShowPairDeviceModal] = useState<boolean>(false);
  const [showMobileTesterModal, setShowMobileTesterModal] = useState<boolean>(false);
  const [showPwaInstallerModal, setShowPwaInstallerModal] = useState<boolean>(false);

  // Background Telemetry Simulator loop (Simulates live IoT Heartbeats in development only)
  useEffect(() => {
    if (!isSimulating || import.meta.env.PROD) return;

    const interval = setInterval(() => {
      setDevices((prevDevices) =>
        prevDevices.map((dev) => {
          if (dev.status === 'offline') return dev;

          // Tiny realistic fluctuation in alternator voltage, temp, and occasional impression count
          const voltageDrift = Number((13.6 + (Math.random() * 0.4 - 0.2)).toFixed(1));
          const tempDrift = Number((38.0 + (Math.random() * 2.0 - 1.0)).toFixed(1));
          const impressionGain = dev.status === 'online' ? Math.floor(Math.random() * 2) : 0;

          return {
            ...dev,
            totalImpressionsToday: dev.totalImpressionsToday + impressionGain,
            telemetry: {
              ...dev.telemetry,
              batteryVoltage: voltageDrift,
              cpuTemp: tempDrift,
              lastHeartbeat: 'Agora mesmo',
            },
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Handler to record a Proof-of-Play (PoP) audit log from a TV
  const handleRecordProofOfPlay = (log: ProofOfPlayLog) => {
    setProofOfPlayLogs((prev) => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    apiClient.recordProofOfPlay(log).catch(console.error);

    // Update campaign counters
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === log.campaignId) {
          return {
            ...c,
            totalImpressions: c.totalImpressions + 1,
            totalInteractions: log.interacted ? c.totalInteractions + 1 : c.totalInteractions,
            totalScans: log.interactionType === 'qr_scan' ? c.totalScans + 1 : c.totalScans,
            budgetSpent: c.budgetSpent + (c.cpm / 1000),
          };
        }
        return c;
      })
    );

    // Update device counters
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === log.deviceId) {
          return {
            ...d,
            totalImpressionsToday: d.totalImpressionsToday + 1,
            totalInteractionsToday: log.interacted ? d.totalInteractionsToday + 1 : d.totalInteractionsToday,
          };
        }
        return d;
      })
    );
  };

  // Remote command handler
  const handleSendRemoteCommand = (deviceId: string, command: string) => {
    apiClient.sendRemoteCommand(deviceId, command).catch(console.error);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          if (command === 'REBOOT_APP') {
            return {
              ...d,
              telemetry: { ...d.telemetry, lastHeartbeat: 'Reiniciando Player...' }
            };
          }
          if (command === 'FORCE_SYNC') {
            return {
              ...d,
              offlineQueueCount: 0,
              telemetry: { ...d.telemetry, lastHeartbeat: 'Cache 100% Sincronizado' }
            };
          }
        }
        return d;
      })
    );
  };

  // Update device GPS coordinates (for GPS simulation)
  const handleUpdateDeviceLocation = (
    deviceId: string,
    lat: number,
    lng: number,
    address: string,
    neighborhood: string
  ) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          return {
            ...d,
            currentLocation: {
              ...d.currentLocation,
              lat,
              lng,
              address,
              neighborhood,
            },
          };
        }
        return d;
      })
    );
  };

  // Launch Player for specific device
  const handleLaunchPlayerForDevice = (deviceId: string) => {
    setActivePlayerDeviceId(deviceId);
    setActiveTab('player');
  };

  // Toggle Campaign active/paused
  const handleToggleCampaignStatus = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          return {
            ...c,
            status: c.status === 'active' ? 'paused' : 'active',
          };
        }
        return c;
      })
    );
    apiClient.toggleCampaignStatus(campaignId).catch(console.error);
  };

  // Save new campaign
  const handleSaveCampaign = (newCmp: Campaign) => {
    setCampaigns([newCmp, ...campaigns]);
    apiClient.saveCampaign(newCmp).catch(console.error);
  };

  // Save new device
  const handleSaveNewDevice = (newDev: Device) => {
    setDevices([newDev, ...devices]);
    apiClient.saveDevice(newDev).catch(console.error);
  };

  // Update existing device settings
  const handleUpdateDevice = (updated: Device) => {
    setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDeviceForDetail(updated);
    apiClient.updateDevice(updated).catch(console.error);
  };

  // Driver PIX payment
  const handlePayDriverPix = (driverId: string) => {
    apiClient.payoutDriverPix(driverId).catch(console.error);
  };

  const activeDeviceForPlayer = devices.find((d) => d.id === activePlayerDeviceId) || devices[0];
  const onlineCount = devices.filter((d) => d.status === 'online').length;

  // If in Pure Kiosk Player Mode, render full screen TV layout directly
  if (activeTab === 'player') {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
        <KioskPlayer
          device={activeDeviceForPlayer}
          campaigns={campaigns}
          geoFences={geoFences}
          onExitPlayer={() => setActiveTab('overview')}
          onRecordProofOfPlay={handleRecordProofOfPlay}
          onUpdateDeviceLocation={handleUpdateDeviceLocation}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsMasterMode(false);
          setActiveTab(tab);
        }}
        onlineDevicesCount={onlineCount}
        totalDevicesCount={devices.length}
        onLaunchKiosk={() => setActiveTab('player')}
        onOpenMobileTester={() => setShowMobileTesterModal(true)}
        onOpenPwaInstaller={() => setShowPwaInstallerModal(true)}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        currentOrg={currentOrg}
        isMasterMode={isMasterMode}
        onToggleMasterMode={() => setIsMasterMode(!isMasterMode)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        
        {apiError && (
          <div className="mb-4 bg-red-950/90 border border-red-500/60 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between text-sm shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-medium">{apiError}</span>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-red-300 hover:text-white p-1 ml-3 rounded hover:bg-red-900/50 cursor-pointer transition-colors"
              title="Fechar aviso de erro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Independent SaaS Master Admin Module */}
        {isMasterMode ? (
          <SaaSMasterAdmin
            organizations={organizations}
            plans={SAAS_PLANS}
            invoices={INITIAL_INVOICES}
            currentOrg={currentOrg}
            onSelectOrg={(org) => {
              setCurrentOrgId(org.id);
              setIsMasterMode(false);
            }}
            onUpdateOrg={handleUpdateOrg}
            onCreateOrg={handleCreateOrg}
            onDeleteOrg={handleDeleteOrg}
            onExitMasterMode={() => setIsMasterMode(false)}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewDashboard
                devices={devices}
                campaigns={campaigns}
                drivers={drivers}
                geoFences={geoFences}
                proofOfPlayLogs={proofOfPlayLogs}
                onSelectDevice={(dev) => setSelectedDeviceForDetail(dev)}
                onLaunchPlayerForDevice={handleLaunchPlayerForDevice}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'registrations' && (
              <RegistrationCenter
                drivers={drivers}
                devices={devices}
                advertisers={advertisers}
                saasUsers={saasUsers}
                organizations={organizations}
                plans={SAAS_PLANS}
                currentOrg={currentOrg}
                onSaveDriver={handleSaveDriver}
                onUpdateDriver={handleUpdateDriver}
                onDeleteDriver={handleDeleteDriver}
                onSaveDevice={handleSaveDevice}
                onUpdateDevice={handleUpdateDevice}
                onDeleteDevice={handleDeleteDevice}
                onSaveAdvertiser={handleSaveAdvertiser}
                onUpdateAdvertiser={handleUpdateAdvertiser}
                onDeleteAdvertiser={handleDeleteAdvertiser}
                onSaveSaaSUser={handleSaveSaaSUser}
                onUpdateSaaSUser={handleUpdateSaaSUser}
                onDeleteSaaSUser={handleDeleteSaaSUser}
                onSaveOrg={handleCreateOrg}
                onUpdateOrg={handleUpdateOrg}
                onDeleteOrg={handleDeleteOrg}
                onLaunchPlayerForDevice={handleLaunchPlayerForDevice}
              />
            )}

            {activeTab === 'mapbox' && (
              <MapboxGeoManager
                geoFences={geoFences}
                devices={devices}
                campaigns={campaigns}
                onAddGeoFence={handleAddGeoFence}
                onUpdateGeoFence={handleUpdateGeoFence}
                onDeleteGeoFence={handleDeleteGeoFence}
                onSelectDevice={(devId) => {
                  const dev = devices.find(d => d.id === devId);
                  if (dev) setSelectedDeviceForDetail(dev);
                }}
              />
            )}

            {activeTab === 'devices' && (
              <DeviceManager
                devices={devices}
                drivers={drivers}
                onSelectDevice={(dev) => setSelectedDeviceForDetail(dev)}
                onLaunchPlayerForDevice={handleLaunchPlayerForDevice}
                onSendRemoteCommand={handleSendRemoteCommand}
                onPairNewDevice={() => setShowPairDeviceModal(true)}
                onOpenMobileTester={() => setShowMobileTesterModal(true)}
                onOpenPwaInstaller={() => setShowPwaInstallerModal(true)}
              />
            )}

            {activeTab === 'campaigns' && (
              <CampaignManager
                campaigns={campaigns}
                geoFences={geoFences}
                onCreateNewCampaign={() => setShowNewCampaignModal(true)}
                onToggleCampaignStatus={handleToggleCampaignStatus}
                onSelectCampaignForPreview={(cmp) => {
                  setActiveTab('player');
                }}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsReports
                proofOfPlayLogs={proofOfPlayLogs}
                campaigns={campaigns}
                devices={devices}
              />
            )}

            {activeTab === 'drivers' && (
              <DriversManager
                drivers={drivers}
                onPayDriverPix={handlePayDriverPix}
              />
            )}

            {activeTab === 'driver_portal' && (
              <DriverPortal
                drivers={drivers}
                devices={devices}
                campaigns={campaigns}
                onOpenPlayer={() => setActiveTab('player')}
              />
            )}

            {activeTab === 'advertiser_portal' && (
              <AdvertiserPortal
                campaigns={campaigns}
                geoFences={geoFences}
                proofOfPlayLogs={proofOfPlayLogs}
                onAddNewCampaign={(newCamp) => setCampaigns([newCamp, ...campaigns])}
                onOpenPlayerPreview={(campId) => setActiveTab('player')}
              />
            )}

            {activeTab === 'passenger_portal' && (
              <PassengerPortal
                currentDriver={drivers[0]}
                campaigns={campaigns}
                onOpenPlayer={() => setActiveTab('player')}
              />
            )}

            {activeTab === 'saas' && (
              <SaaSBillingManager
                currentOrg={currentOrg}
                onUpdateOrg={handleUpdateOrg}
                onSwitchOrg={handleSwitchOrg}
                organizations={organizations}
              />
            )}

            {activeTab === 'architecture' && (
              <ArchitectureDoc />
            )}
          </>
        )}

      </main>

      {/* MODAL 1: Device Detail & Remote Controls */}
      {selectedDeviceForDetail && (
        <DeviceDetailModal
          device={selectedDeviceForDetail}
          drivers={drivers}
          onClose={() => setSelectedDeviceForDetail(null)}
          onLaunchPlayer={(devId) => {
            setSelectedDeviceForDetail(null);
            handleLaunchPlayerForDevice(devId);
          }}
          onUpdateDevice={handleUpdateDevice}
        />
      )}

      {/* MODAL 2: Create Campaign */}
      {showNewCampaignModal && (
        <NewCampaignModal
          geoFences={geoFences}
          onClose={() => setShowNewCampaignModal(false)}
          onSaveCampaign={handleSaveCampaign}
        />
      )}

      {/* MODAL 3: Pair New Device */}
      {showPairDeviceModal && (
        <PairDeviceModal
          drivers={drivers}
          onClose={() => setShowPairDeviceModal(false)}
          onSaveNewDevice={handleSaveNewDevice}
        />
      )}

      {/* MODAL 4: Mobile / Smartphone Tester */}
      {showMobileTesterModal && (
        <MobileTesterModal
          device={activeDeviceForPlayer}
          drivers={drivers}
          onClose={() => setShowMobileTesterModal(false)}
          onLaunchPlayer={(devId) => {
            setShowMobileTesterModal(false);
            handleLaunchPlayerForDevice(devId);
          }}
        />
      )}

      {/* MODAL 5: Dedicated PWA Kiosk Screen Installer & QR Pairer */}
      {showPwaInstallerModal && (
        <PwaInstallerModal
          isOpen={showPwaInstallerModal}
          onClose={() => setShowPwaInstallerModal(false)}
          devices={devices}
          onLaunchPlayer={(devId) => {
            setShowPwaInstallerModal(false);
            handleLaunchPlayerForDevice(devId);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-400 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VeloMedia DOOH &copy; 2026 — Plataforma SaaS de Gestão de Mídia & Telas Interativas Veiculares</span>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Mapbox Vector & MQTT QoS 1 Ativo</span>
            </span>
            <span>•</span>
            <span>Proof-of-Play SHA-256 Auditado</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

