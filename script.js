/**
 * AI Knowledge Base Article Generator
 * Enterprise IT Support Knowledge Management System
 * Modular Frontend Application Architecture (Single Page Application)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Initial State & Realistic Sample Data
  // =========================================================================

  const INITIAL_DOCS = [
    { id: 'doc-1', name: 'Cisco_ASA_AnyConnect_Config_v4.2.pdf', type: 'PDF', size: '2.4 MB', uploadDate: 'Sep 24, 2026', status: 'Indexed', chunks: 420 },
    { id: 'doc-2', name: 'Enterprise_VPN_MTU_Runbook.md', type: 'Markdown', size: '145 KB', uploadDate: 'Sep 25, 2026', status: 'Indexed', chunks: 85 },
    { id: 'doc-3', name: 'Global_Firewall_Rules_Matrix.docx', type: 'DOCX', size: '890 KB', uploadDate: 'Sep 26, 2026', status: 'Indexed', chunks: 310 },
    { id: 'doc-4', name: 'PostgreSQL_High_Availability_Patroni.md', type: 'Markdown', size: '320 KB', uploadDate: 'Sep 18, 2026', status: 'Indexed', chunks: 140 },
    { id: 'doc-5', name: 'Kubernetes_Production_Resource_Quotas.pdf', type: 'PDF', size: '3.1 MB', uploadDate: 'Sep 20, 2026', status: 'Indexed', chunks: 560 },
    { id: 'doc-6', name: 'Azure_AD_Conditional_Access_Standard.docx', type: 'DOCX', size: '1.2 MB', uploadDate: 'Sep 22, 2026', status: 'Indexed', chunks: 290 },
    { id: 'doc-7', name: 'Zero_Trust_Network_Access_Policy.txt', type: 'TXT', size: '110 KB', uploadDate: 'Sep 15, 2026', status: 'Indexed', chunks: 48 },
    { id: 'doc-8', name: 'Redis_Cluster_Failover_Procedures.md', type: 'Markdown', size: '210 KB', uploadDate: 'Sep 12, 2026', status: 'Indexed', chunks: 92 },
    { id: 'doc-9', name: 'AWS_DirectConnect_BGP_Architecture.pdf', type: 'PDF', size: '4.5 MB', uploadDate: 'Sep 10, 2026', status: 'Indexed', chunks: 680 },
    { id: 'doc-10', name: 'Linux_Kernel_OOM_Tuning_Guide.txt', type: 'TXT', size: '85 KB', uploadDate: 'Sep 08, 2026', status: 'Indexed', chunks: 62 },
    { id: 'doc-11', name: 'Exchange_Online_Modern_Auth_Transition.docx', type: 'DOCX', size: '1.6 MB', uploadDate: 'Sep 05, 2026', status: 'Indexed', chunks: 340 },
    { id: 'doc-12', name: 'Datadog_Synthetic_Monitoring_Runbook.md', type: 'Markdown', size: '190 KB', uploadDate: 'Sep 01, 2026', status: 'Indexed', chunks: 88 }
  ];

  const SAMPLE_SCENARIOS = {
    'vpn-timeout': {
      title: 'Resolving Cisco AnyConnect VPN Error 412: Handshake Timeout on Remote Gateways',
      category: 'Network & VPN',
      audience: 'Tier 1/2 Support Engineers',
      ticketId: 'INC-89241',
      ticketText: `[Ticket ID: INC-89241]
Customer: Global Remote Engineering Team (42 users impacted)
Severity: P2 - High
Symptoms:
Users reporting sudden disconnection during Cisco AnyConnect client negotiation on gateway us-east-vpn.enterprise.net.
Error message popup on client: "The VPN connection failed due to unsuccessful handshake or timeout. Error code 412."
Client version: AnyConnect 4.10.05085 on Windows 11 & macOS Sonoma.

Diagnostic Analysis & Logs:
- Checked ASA 5585-X firewall logs: DTLS handshake packet drops observed on UDP 443.
- Traceroute showed path MTU was clamped down to 1380 bytes due to upstream ISP fiber routing changes.
- Default AnyConnect MTU was negotiated at 1500 bytes, causing fragmented UDP packets that intermediate routers dropped silently.
- Ping with Don't Fragment flag (ping -f -l 1400 10.200.0.1) consistently failed.

Resolution Applied:
1. Reconfigured the tunnel group profile 'Enterprise-Remote-Users' to force MTU clamping to 1360 bytes.
2. Enabled dynamic MTU discovery on ASA: 'sysopt connection tcpmss 1360'.
3. Pushed client profile update setting '<MTU>1360</MTU>' in AnyConnect Profile.xml.
4. Tested handshake across 5 regional test workstations; TLS and DTLS sessions established in <1.2 seconds without timeout.
5. All 42 users reconnected successfully. Closed ticket after 2 hours monitoring.`,
      problem: `Remote end-users initiating VPN connections via Cisco AnyConnect Client encounter immediate session termination during security parameter negotiation. The client fails with error dialog: "The VPN connection failed due to unsuccessful handshake or timeout. Error code 412."
Impacted Systems: Endpoints connecting through ASA 5585-X firewalls via WAN/cellular transit where carrier Path MTU is constrained below 1500 bytes.`,
      rootCause: `Packet captures confirm a Path MTU Black Hole between the endpoint and the ASA headend:
- The AnyConnect client defaults to an Ethernet standard MTU of 1500 bytes during DTLS tunnel initialization.
- Upstream carrier fiber transit clamped the route MTU to 1380 bytes, while intermediate border firewalls dropped ICMP Type 3 ("Fragmentation Needed") notification packets.
- Large cryptographic certificate payload packets exceeded 1380 bytes and were dropped silently, triggering client-side timeout Error 412.`,
      solution: `Enforce TCP MSS clamping and configure the AnyConnect tunnel group MTU ceiling to 1360 bytes on the gateway. Concurrently update the client profile XML to enable dynamic path MTU detection.`,
      troubleshooting: [
        {
          num: 'Step 1',
          heading: 'Probe Path MTU from Client Endpoint',
          desc: 'Verify maximum packet transmission size without fragmentation to the VPN endpoint:',
          codeLang: 'PowerShell',
          code: 'ping -f -l 1372 us-east-vpn.enterprise.net',
          hint: 'If packet fragmentation error occurs, decrement packet size by 20 bytes until response ping succeeds.'
        },
        {
          num: 'Step 2',
          heading: 'Configure ASA Gateway MTU Clamping',
          desc: 'Apply MTU policy adjustments on the Cisco ASA firewall CLI:',
          codeLang: 'Cisco ASA CLI',
          code: `ciscoasa(config)# group-policy Enterprise-Remote-Users attributes
ciscoasa(config-group-policy)# mtu 1360
ciscoasa(config-group-policy)# sysopt connection tcpmss 1360
ciscoasa(config)# write memory`
        },
        {
          num: 'Step 3',
          heading: 'Update AnyConnect Client Profile',
          desc: 'Ensure client initialization parameters declare MTU restrictions in Profile.xml:',
          codeLang: 'XML Profile Config',
          code: `<ClientInitialization>
  <MTU>1360</MTU>
  <DynamicPathMTU>true</DynamicPathMTU>
</ClientInitialization>`
        },
        {
          num: 'Step 4',
          heading: 'Verification & Post-Fix Checks',
          desc: 'Reconnect the AnyConnect client and verify connection metrics:',
          checklist: [
            'DTLS AES-256 cipher negotiated within 1.5s',
            'Inbound/Outbound traffic counters incrementing without packet drops',
            'Internal intranet gateway 10.200.0.1 responds <15ms'
          ]
        }
      ],
      citations: [
        { type: 'Source Ticket', tag: 'INC-89241', text: 'AnyConnect client negotiation timeout on gateway us-east-vpn (Error 412)', meta: 'Resolved by Tier 3 NetOps Team' },
        { type: 'Technical Manual', tag: 'Doc Ref §4.2', text: 'Cisco ASA AnyConnect Configuration Guide (v4.2): Path MTU Discovery & DTLS Tuning', meta: 'Pages 84-89 • Match Grounding: 99%' },
        { type: 'Runbook', tag: 'Runbook-NET-12', text: 'Enterprise VPN MTU Clamping Runbook: Carrier MPLS & Fiber Transit Norms', meta: 'Section 3.1 • Updated Sep 2026' }
      ]
    },

    'postgres-lag': {
      title: 'Mitigating PostgreSQL High Replication Lag on Read Replicas During Batch Ingestion',
      category: 'Databases & Storage',
      audience: 'DevOps & System Architects',
      ticketId: 'INC-77402',
      ticketText: `[Ticket ID: INC-77402]
System: PostgreSQL 15.4 RDS Primary and Read Replicas (db-replica-02, db-replica-03)
Severity: P2 - High
Symptoms:
Analytics microservice threw timeout exceptions (HTTP 504) due to read queries routing to replica-02 being stale by >180 seconds.
CloudWatch Alarm 'PostgresReplicaLag' alerted at 220s lag (threshold: 30s).

Investigation & Root Cause:
- Long-running ETL bulk load query on the primary table 'audit_events' held an AccessExclusiveLock on partition partitions_2026_q3.
- Wal receiver process on replica-02 was blocked by conflicting long analytical read queries (PID 48192 running for 28 minutes).
- 'max_standby_streaming_delay' was configured at 30s, causing recovery conflicts and eventual cancellation of queries.

Resolution Applied:
1. Cancelled blocking analytical query PID 48192 via pg_cancel_backend().
2. Adjusted 'hot_standby_feedback = on' on read replicas to prevent vacuum cleanup on primary of rows still needed by standby.
3. Partitioned large writes into smaller 5,000-row chunks with explicit commit intervals.
4. Replication lag dropped back to 0.4s within 4 minutes.`,
      problem: `Analytics microservices executing read queries on PostgreSQL standby replica-02 experienced data staleness exceeding 180 seconds, triggering HTTP 504 gateway timeouts.
Impacted Systems: Reporting services and customer-facing dashboard queries routed to read replicas during automated end-of-quarter ETL batch jobs.`,
      rootCause: `Replication stream recovery conflict occurred on the standby instance:
- A high-volume bulk insertion job on the primary generated massive WAL traffic while executing partition maintenance.
- Standby query PID 48192 held an open read snapshot that conflicted with WAL log replay.
- The replica stalled replay until 'max_standby_streaming_delay' elapsed, creating exponential replication lag.`,
      solution: `Enable 'hot_standby_feedback = on' on read replicas, tune 'max_standby_streaming_delay', and batch primary ingest transactions into smaller non-blocking chunks.`,
      troubleshooting: [
        {
          num: 'Step 1',
          heading: 'Inspect Replication Lag and Conflicting Queries',
          desc: 'Query the standby recovery conflict statistics and identify stalled backend PIDs:',
          codeLang: 'SQL',
          code: `SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;`,
          hint: 'Look for queries in state "active" exceeding 300 seconds.'
        },
        {
          num: 'Step 2',
          heading: 'Terminate Blocking Read Query if Lag Exceeds Threshold',
          desc: 'Safely terminate the stalled analytical query to allow WAL replay to resume:',
          codeLang: 'SQL',
          code: 'SELECT pg_cancel_backend(48192);'
        },
        {
          num: 'Step 3',
          heading: 'Configure Hot Standby Feedback on Replica',
          desc: 'Prevent primary vacuuming from conflicting with standby queries by enabling feedback in postgresql.conf:',
          codeLang: 'Bash / Config',
          code: `ALTER SYSTEM SET hot_standby_feedback = 'on';
ALTER SYSTEM SET max_standby_streaming_delay = '60s';
SELECT pg_reload_conf();`
        },
        {
          num: 'Step 4',
          heading: 'Confirm WAL Replay Status',
          desc: 'Verify byte lag and time lag return to baseline:',
          checklist: [
            'pg_stat_replication shows replay_lag < 1.0 second',
            'CloudWatch Alarm PostgresReplicaLag returns to OK status',
            'ETL batch pipeline completes with zero 504 timeouts'
          ]
        }
      ],
      citations: [
        { type: 'Source Ticket', tag: 'INC-77402', text: 'High replication lag on read-replica db-02 during audit ETL job', meta: 'Resolved by Database Reliability Engineering' },
        { type: 'Runbook', tag: 'Postgres-Runbook', text: 'PostgreSQL High Availability & Patroni Operational Runbook', meta: 'Chapter 4: Standby Conflict Mitigation' }
      ]
    },

    'k8s-oom': {
      title: 'Remediating Kubernetes Pod CrashLoopBackOff Caused by OOMKilled in Auth Service',
      category: 'Cloud & Kubernetes',
      audience: 'DevOps & System Architects',
      ticketId: 'INC-91044',
      ticketText: `[Ticket ID: INC-91044]
Cluster: Production EKS Cluster us-west-2
Namespace: production-auth
Service: auth-gateway-service
Symptoms:
Pods restarting cyclically every 45 seconds. Status: CrashLoopBackOff.
Kubectl describe showed: 'Last State: Terminated, Reason: OOMKilled, Exit Code: 137'.
Users getting sporadic 502 Bad Gateway during token exchange.

Root Cause:
- Go memory allocator heap cache grew unbounded during a spike of JWT validation requests containing large OAuth scopes.
- Pod resource limits were configured at 256Mi memory limit, while the baseline RSS footprint had grown to 280Mi under peak concurrency.
- Linux cgroup killer terminated the container process immediately upon breaching 256Mi.

Resolution:
1. Increased memory limit from 256Mi to 512Mi with request at 256Mi in deployment spec.
2. Tuned Go runtime GOMEMLIMIT environment variable to '460MiB' to enforce GC before cgroup termination.
3. Added HPA (Horizontal Pod Autoscaler) target at 75% memory utilization.
4. Pods stabilized immediately with 0 restarts across 12 replicas.`,
      problem: `Authentication gateway pods in namespace 'production-auth' suffered cyclical terminations with status CrashLoopBackOff (Exit Code 137: OOMKilled), creating transient HTTP 502 Bad Gateway errors for end-user logins.
Impacted Systems: All single sign-on (SSO) login and token refresh requests routed through the authentication microservice mesh.`,
      rootCause: `The container process exceeded its configured Kubernetes memory ceiling:
- Surging OAuth token validation requests pushed heap memory usage to 280MiB.
- The deployment manifest enforced a strict cgroup memory limit of 256MiB.
- The Linux kernel OOM killer sent SIGKILL (exit code 137) to the process upon breaching the cgroup limit.`,
      solution: `Adjust container resource memory requests and limits to 512MiB, configure the Go runtime 'GOMEMLIMIT' variable to enforce aggressive garbage collection prior to cgroup limits, and enable Horizontal Pod Autoscaling (HPA).`,
      troubleshooting: [
        {
          num: 'Step 1',
          heading: 'Check Pod Termination Reason and Exit Code',
          desc: 'Verify the container termination reason via kubectl describe:',
          codeLang: 'Bash',
          code: 'kubectl describe pod -l app=auth-gateway -n production-auth | grep -A 5 "Last State:"',
          hint: 'Verify "Reason: OOMKilled" and "Exit Code: 137".'
        },
        {
          num: 'Step 2',
          heading: 'Update Container Resource Limits in Deployment',
          desc: 'Patch the deployment with adequate memory boundaries:',
          codeLang: 'YAML Patch',
          code: `spec:
  template:
    spec:
      containers:
      - name: auth-gateway
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "1000m"`
        },
        {
          num: 'Step 3',
          heading: 'Configure GOMEMLIMIT Environment Variable',
          desc: 'Set soft memory limit in container environment to trigger runtime GC at 90% threshold:',
          codeLang: 'YAML',
          code: `env:
- name: GOMEMLIMIT
  value: "460MiB"`
        },
        {
          num: 'Step 4',
          heading: 'Verify Pod Health and Replica Stabilization',
          desc: 'Confirm pods enter Running state with 0 restarts:',
          checklist: [
            'All replicas report Ready (1/1) status',
            'Restart count remains static at 0 for >30 minutes',
            'Grafana container memory panel shows headroom >25%'
          ]
        }
      ],
      citations: [
        { type: 'Source Ticket', tag: 'INC-91044', text: 'Auth gateway pod crashloopbackoff due to OOMKilled', meta: 'Resolved by Cloud Platform Team' },
        { type: 'Manual', tag: 'K8s-Doc-4.1', text: 'Kubernetes Production Resource Quotas & Memory Management', meta: 'Section 6: Cgroup OOM Killer Prevention' }
      ]
    },

    'outlook-auth': {
      title: 'Resolving Microsoft Outlook Modern Authentication Token Loop under Azure AD Conditional Access',
      category: 'Identity & Security',
      audience: 'Tier 1/2 Support Engineers',
      ticketId: 'INC-65219',
      ticketText: `[Ticket ID: INC-65219]
Customer: Corporate Finance Department (18 workstations)
Application: Microsoft Outlook 365 on Windows 11
Severity: P3 - Medium
Symptoms:
Outlook repeatedly presents the modern authentication login prompt every 10 minutes. Even after successful password + MFA entry, the password prompt reappears with status 'Need Password' in Outlook status bar.

Investigation:
- Azure AD Sign-in logs showed error code 50058: "Session information is not sufficient for single-sign-on."
- Corrupt Web Account Manager (WAM) broker token cache stored under %localappdata%\\Packages\\Microsoft.AAD.BrokerPlugin_cw5n1h2txyewy.
- Azure AD Device Registration token in Workplace Joined credentials was in a desynchronized state.

Resolution Applied:
1. Closed all Office 365 applications.
2. Cleared cached identity credentials via credential manager (Windows Credentials > Generic Credentials > MicrosoftOffice16_Data).
3. Re-registered AAD broker package via PowerShell:
   Add-AppxPackage -Register "$env:windir\\SystemApps\\Microsoft.AAD.BrokerPlugin_cw5n1h2txyewy\\Appxmanifest.xml" -DisableDevelopmentMode -ForceApplicationShutdown
4. Re-launched Outlook; single MFA prompt completed, and connection status remained 'Connected to Microsoft Exchange' without re-prompting.`,
      problem: `Microsoft 365 Outlook users experience an infinite modern authentication credential prompt loop. Entering valid credentials and MFA satisfies the prompt momentarily, but status reverts to "Need Password" within minutes.
Impacted Systems: Windows 11 enterprise-managed laptops connecting to Exchange Online with Azure AD Conditional Access policies enabled.`,
      rootCause: `Corrupted local Web Account Manager (WAM) broker plugin cache on the Windows workstation:
- The local broker package failed to refresh the primary refresh token (PRT) with Azure AD.
- Cached Office 365 identity tokens in Windows Credential Manager conflicted with the cloud security principal, invalidating the session.`,
      solution: `Clear stale Windows Generic Credentials for Office 365 and re-register the Microsoft.AAD.BrokerPlugin package using PowerShell.`,
      troubleshooting: [
        {
          num: 'Step 1',
          heading: 'Close All Office Applications',
          desc: 'Terminate running Outlook, Teams, and Word processes from Task Manager or command line:',
          codeLang: 'PowerShell',
          code: 'taskkill /F /IM outlook.exe /IM teams.exe',
          hint: 'Ensure all background Office processes are fully terminated.'
        },
        {
          num: 'Step 2',
          heading: 'Clear Stale Generic Office Credentials',
          desc: 'Remove cached identity tokens from Windows Credential Manager:',
          codeLang: 'Command Prompt',
          code: `cmdkey /list | findstr "MicrosoftOffice16"
cmdkey /delete:MicrosoftOffice16_Data:SSPI:user@enterprise.org`
        },
        {
          num: 'Step 3',
          heading: 'Re-register Azure AD Broker Plugin',
          desc: 'Run elevated PowerShell command to reset the native authentication broker:',
          codeLang: 'PowerShell (Admin)',
          code: `Add-AppxPackage -Register "$env:windir\\SystemApps\\Microsoft.AAD.BrokerPlugin_cw5n1h2txyewy\\Appxmanifest.xml" -DisableDevelopmentMode -ForceApplicationShutdown`
        },
        {
          num: 'Step 4',
          heading: 'Launch Outlook and Verify Connection',
          desc: 'Complete one-time interactive login and check Exchange status bar:',
          checklist: [
            'Interactive modern auth dialog completes with MFA push',
            'Status bar displays "Connected to: Microsoft Exchange"',
            'No prompt returns after 30 minutes of continuous operation'
          ]
        }
      ],
      citations: [
        { type: 'Source Ticket', tag: 'INC-65219', text: 'Outlook repeated authentication prompt loop under Conditional Access', meta: 'Resolved by Desktop Engineering' },
        { type: 'Runbook', tag: 'M365-Identity-Runbook', text: 'Enterprise M365 Modern Authentication & AAD WAM Troubleshooting Guide', meta: 'Section 2.4' }
      ]
    }
  };

  const INITIAL_ARTICLES = [
    {
      id: 'KB-NET-89241',
      title: 'Resolving Cisco AnyConnect VPN Error 412: Handshake Timeout & Path MTU Clamping',
      sourceTicket: 'INC-89241',
      category: 'Network & VPN',
      date: 'Sep 29, 2026',
      reviewer: 'Alex Rivera (SME)',
      status: 'Published',
      scenarioKey: 'vpn-timeout'
    },
    {
      id: 'KB-DB-77402',
      title: 'Mitigating PostgreSQL High Replication Lag on Read Replicas During Batch Ingestion',
      sourceTicket: 'INC-77402',
      category: 'Databases & Storage',
      date: 'Sep 28, 2026',
      reviewer: 'DevOps Lead',
      status: 'Published',
      scenarioKey: 'postgres-lag'
    },
    {
      id: 'KB-K8S-91044',
      title: 'Remediating Kubernetes Pod CrashLoopBackOff Caused by OOMKilled in Auth Service',
      sourceTicket: 'INC-91044',
      category: 'Cloud & Kubernetes',
      date: 'Sep 27, 2026',
      reviewer: 'Cloud Platform SME',
      status: 'Published',
      scenarioKey: 'k8s-oom'
    },
    {
      id: 'KB-IAM-65219',
      title: 'Resolving Microsoft Outlook Modern Authentication Token Loop under Azure AD Conditional Access',
      sourceTicket: 'INC-65219',
      category: 'Identity & Security',
      date: 'Sep 26, 2026',
      reviewer: 'Alex Rivera',
      status: 'Published',
      scenarioKey: 'outlook-auth'
    },
    {
      id: 'KB-NET-73109',
      title: 'Troubleshooting AWS DirectConnect BGP Session Flapping on Primary Transit Gateway',
      sourceTicket: 'INC-73109',
      category: 'Network & VPN',
      date: 'Sep 24, 2026',
      reviewer: 'NetOps Senior',
      status: 'Pending Review',
      scenarioKey: 'vpn-timeout'
    },
    {
      id: 'KB-APP-54120',
      title: 'Fixing Node.js Memory Leak on High WebSocket Concurrency via Heap Dump Analysis',
      sourceTicket: 'INC-54120',
      category: 'Workstation & Software',
      date: 'Sep 22, 2026',
      reviewer: 'Alex Rivera',
      status: 'Draft',
      scenarioKey: 'k8s-oom'
    }
  ];

  const INITIAL_ACTIVITIES = [
    { type: 'generated', title: 'New article generated from INC-89241', time: '12 minutes ago', badge: 'AI Generated', color: '#4f46e5' },
    { type: 'reviewed', title: 'Article KB-DB-77402 approved for production', time: '1 hour ago', badge: 'Published', color: '#10b981' },
    { type: 'docs', title: 'Technical manual Cisco_ASA_AnyConnect_Config_v4.2.pdf indexed', time: '3 hours ago', badge: 'Doc RAG', color: '#06b6d4' },
    { type: 'ticket', title: 'Batch of 14 resolved tickets ingested from Jira Service Management', time: '5 hours ago', badge: 'Sync', color: '#8b5cf6' }
  ];

  const INITIAL_QUEUE = [
    { id: 'INC-93411', title: 'Redis Sentinel split-brain error during automated failover', category: 'Databases & Storage', priority: 'P2' },
    { id: 'INC-93405', title: 'SSL certificate handshake timeout on legacy reverse proxy', category: 'Network & VPN', priority: 'P2' },
    { id: 'INC-93388', title: 'Okta SCIM synchronization failure for newly provisioned contractor accounts', category: 'Identity & Security', priority: 'P3' }
  ];

  // =========================================================================
  // 2. Application Core Class
  // =========================================================================

  class App {
    constructor() {
      this.currentView = 'dashboard';
      this.articles = JSON.parse(localStorage.getItem('kb_articles')) || INITIAL_ARTICLES;
      this.docs = JSON.parse(localStorage.getItem('kb_docs')) || INITIAL_DOCS;
      this.activities = INITIAL_ACTIVITIES;
      this.queue = INITIAL_QUEUE;
      this.currentScenario = SAMPLE_SCENARIOS['vpn-timeout'];
      
      this.init();
    }

    init() {
      this.initTheme();
      this.initNavigation();
      this.initDashboard();
      this.initGenerator();
      this.initArticlePreview();
      this.initHistory();
      this.initDocumentation();
      this.initSettings();
      this.initGlobalSearch();
      this.initModals();
      this.renderAll();
      this.checkBackendHealth();

      // Check URL hash for direct view navigation
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'generate', 'history', 'documentation', 'settings'].includes(hash)) {
        this.navigateTo(hash);
      }
    }

    // -----------------------------------------------------------------------
    // Theme Management (Light / Dark)
    // -----------------------------------------------------------------------
    initTheme() {
      const savedTheme = localStorage.getItem('kb_theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);

      const toggleBtn = document.getElementById('themeToggleBtn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme') || 'light';
          const next = current === 'light' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('kb_theme', next);
          this.showToast(`Switched to ${next} mode`);
        });
      }
    }

    // -----------------------------------------------------------------------
    // Navigation (SPA Routing)
    // -----------------------------------------------------------------------
    initNavigation() {
      // Sidebar Navigation Links
      const navLinks = document.querySelectorAll('.nav-link[data-view]');
      navLinks.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetView = btn.getAttribute('data-view');
          this.navigateTo(targetView);
        });
      });

      // Header New Article CTA
      const headerNewBtn = document.getElementById('headerNewArticleBtn');
      if (headerNewBtn) {
        headerNewBtn.addEventListener('click', () => this.navigateTo('generate'));
      }

      // Sidebar CTA
      const sidebarCta = document.getElementById('sidebarGenerateCta');
      if (sidebarCta) {
        sidebarCta.addEventListener('click', () => this.navigateTo('generate'));
      }

      // Mobile Menu Toggle
      const menuBtn = document.getElementById('menuToggleBtn');
      const sidebar = document.getElementById('appSidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      const closeBtn = document.getElementById('sidebarCloseBtn');

      if (menuBtn && sidebar && backdrop) {
        const toggleSidebar = (open) => {
          sidebar.classList.toggle('open', open);
          backdrop.classList.toggle('show', open);
        };

        menuBtn.addEventListener('click', () => toggleSidebar(true));
        backdrop.addEventListener('click', () => toggleSidebar(false));
        if (closeBtn) closeBtn.addEventListener('click', () => toggleSidebar(false));
      }

      // Top Dropdowns (Profile & Notifications)
      this.initDropdown('userProfileBtn', 'profileDropdown');
      this.initDropdown('notifBtn', 'notifDropdown');

      const markAllRead = document.getElementById('markAllReadBtn');
      if (markAllRead) {
        markAllRead.addEventListener('click', () => {
          const unreadDots = document.querySelectorAll('.notif-item.unread');
          unreadDots.forEach(i => i.classList.remove('unread'));
          const notifBadge = document.querySelector('.notif-badge');
          if (notifBadge) notifBadge.style.display = 'none';
          this.showToast('All notifications marked as read');
        });
      }
    }

    initDropdown(triggerId, dropdownId) {
      const trigger = document.getElementById(triggerId);
      const dropdown = document.getElementById(dropdownId);
      if (!trigger || !dropdown) return;

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.profile-dropdown, .notif-dropdown, .search-results-dropdown').forEach(d => {
          if (d !== dropdown) d.classList.remove('show');
        });
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });
    }

    navigateTo(viewName) {
      this.currentView = viewName;
      window.location.hash = viewName;

      // Update Section Active Classes
      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
      });
      const activeSection = document.getElementById(`view-${viewName}`);
      if (activeSection) {
        activeSection.classList.add('active');
      }

      // Update Sidebar Active state
      document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === viewName);
      });

      // Update Header Breadcrumb Title
      const breadcrumbEl = document.getElementById('headerCurrentView');
      if (breadcrumbEl) {
        const titleMap = {
          dashboard: 'Dashboard',
          generate: 'Generate Article',
          history: 'Article History',
          documentation: 'Documentation',
          settings: 'Settings'
        };
        breadcrumbEl.textContent = titleMap[viewName] || 'Dashboard';
      }

      // Close mobile sidebar if open
      const sidebar = document.getElementById('appSidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // -----------------------------------------------------------------------
    // Dashboard Logic & Rendering (Requirement 2 & 4)
    // -----------------------------------------------------------------------
    initDashboard() {
      // Nothing special to bind; renderAll() handles updates
    }

    renderDashboard() {
      // Update Counter Badges
      const statResolved = document.getElementById('statResolvedTickets');
      const statGenerated = document.getElementById('statGeneratedArticles');
      const statPending = document.getElementById('statPendingReviews');
      const statDocs = document.getElementById('statAvailableDocs');

      if (statResolved) statResolved.textContent = '1,428';
      if (statGenerated) statGenerated.textContent = (340 + this.articles.length).toLocaleString();
      if (statPending) statPending.textContent = this.articles.filter(a => a.status === 'Pending Review').length || '7';
      if (statDocs) statDocs.textContent = this.docs.length.toString();

      // Render Recent Generated Articles Table (Requirement 2)
      const recentTbody = document.getElementById('recentArticlesTableBody');
      if (recentTbody) {
        const topArticles = this.articles.slice(0, 4);
        recentTbody.innerHTML = topArticles.map(art => `
          <tr>
            <td>
              <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(art.title)}</div>
              <small style="color: var(--text-muted); font-family: var(--font-mono);">${art.id} • ${art.sourceTicket}</small>
            </td>
            <td><span class="badge badge-neutral">${art.category}</span></td>
            <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${art.date}</span></td>
            <td>${this.getStatusBadgeHtml(art.status)}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="app.viewArticleModal('${art.id}')">
                Preview
              </button>
            </td>
          </tr>
        `).join('');
      }

      // Render Simple Activity Section (Requirement 2)
      const activityContainer = document.getElementById('dashboardActivityList');
      if (activityContainer) {
        activityContainer.innerHTML = this.activities.map(act => `
          <div class="activity-item">
            <div class="activity-dot-icon" style="background: ${act.color}15; color: ${act.color};">
              ●
            </div>
            <div class="activity-content">
              <div class="activity-title">${this.escapeHtml(act.title)}</div>
              <span class="activity-time">${act.time}</span>
            </div>
          </div>
        `).join('');
      }

      // Render Quick Ticket Queue List
      const queueContainer = document.getElementById('quickTicketList');
      if (queueContainer) {
        queueContainer.innerHTML = this.queue.map(q => `
          <div class="quick-ticket-item">
            <div class="quick-ticket-header">
              <span class="quick-ticket-id">${q.id}</span>
              <span class="badge badge-warning" style="font-size: 0.65rem;">${q.priority}</span>
            </div>
            <div class="quick-ticket-title">${this.escapeHtml(q.title)}</div>
            <div class="quick-ticket-footer">
              <span style="font-size: 0.72rem; color: var(--text-muted);">${q.category}</span>
              <button class="btn btn-primary btn-sm" onclick="app.loadQueueTicket('${q.id}')" style="padding: 0.2rem 0.55rem; font-size: 0.74rem;">
                Generate KB
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    loadQueueTicket(ticketId) {
      // Find queue ticket and switch to generate tab with relevant scenario
      const ticket = this.queue.find(q => q.id === ticketId);
      if (!ticket) return;

      if (ticket.category.includes('Database')) {
        this.loadScenario('postgres-lag');
      } else if (ticket.category.includes('Network')) {
        this.loadScenario('vpn-timeout');
      } else {
        this.loadScenario('outlook-auth');
      }

      this.navigateTo('generate');
      this.showToast(`Loaded ticket ${ticketId} into Generator`);
    }

    // -----------------------------------------------------------------------
    // Generate Article Page Logic (Requirement 3 & 4)
    // -----------------------------------------------------------------------
    initGenerator() {
      const templateSelect = document.getElementById('sampleTemplateSelect');
      if (templateSelect) {
        templateSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val && SAMPLE_SCENARIOS[val]) {
            this.loadScenario(val);
            this.showToast(`Loaded scenario: ${SAMPLE_SCENARIOS[val].title.substring(0, 32)}...`);
          }
        });
      }

      // Auto-suggest title button
      const suggestBtn = document.getElementById('btnAutoSuggestTitle');
      if (suggestBtn) {
        suggestBtn.addEventListener('click', () => {
          const titleInput = document.getElementById('articleTitleInput');
          const cat = document.getElementById('articleCategorySelect').value;
          const suggestions = [
            `Standard Resolution Guide: ${titleInput.value.replace(/Resolving |Fixing |Troubleshooting /gi, '')}`,
            `Runbook: Diagnosing & Remediating ${cat} Incident (${new Date().getFullYear()})`,
            `How to Resolve ${titleInput.value}`
          ];
          const chosen = suggestions[Math.floor(Math.random() * suggestions.length)];
          titleInput.value = chosen;
          this.showToast('Updated article title with standard ITIL naming');
        });
      }

      // Word count listener on ticket textarea
      const ticketTextarea = document.getElementById('ticketTextarea');
      const wordCountBadge = document.getElementById('ticketWordCount');
      if (ticketTextarea && wordCountBadge) {
        ticketTextarea.addEventListener('input', () => {
          const words = ticketTextarea.value.trim().split(/\s+/).filter(Boolean).length;
          wordCountBadge.textContent = `${words} words`;
        });
      }

      // Upload Dropzone
      const dropzone = document.getElementById('uploadDropzone');
      const fileInput = document.getElementById('fileUploadInput');
      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer.files.length) {
            this.handleFileUpload(e.dataTransfer.files);
          }
        });
        fileInput.addEventListener('change', (e) => {
          if (e.target.files.length) {
            this.handleFileUpload(e.target.files);
          }
        });
      }

      // Attached Docs removal handler
      const docsList = document.getElementById('attachedDocsList');
      if (docsList) {
        docsList.addEventListener('click', (e) => {
          if (e.target.classList.contains('doc-chip-remove')) {
            const chip = e.target.closest('.doc-chip');
            if (chip) {
              chip.remove();
              this.showToast('Reference document removed from prompt context');
            }
          }
        });
      }

      // Generate Article Button (Requirement 3 & 12 - temporary loading state / demo result)
      const generateBtn = document.getElementById('btnGenerateArticle');
      if (generateBtn) {
        generateBtn.addEventListener('click', () => this.handleGenerateClick());
      }

      // Clear Button (Requirement 3)
      const clearBtn = document.getElementById('btnClearForm');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearGeneratorForm());
      }
    }

    loadScenario(scenarioKey) {
      const scenario = SAMPLE_SCENARIOS[scenarioKey];
      if (!scenario) return;

      this.currentScenario = scenario;

      // Populate Input Fields
      const titleInput = document.getElementById('articleTitleInput');
      const catSelect = document.getElementById('articleCategorySelect');
      const audSelect = document.getElementById('articleAudienceSelect');
      const textarea = document.getElementById('ticketTextarea');

      if (titleInput) titleInput.value = scenario.title;
      if (catSelect) catSelect.value = scenario.category;
      if (audSelect) audSelect.value = scenario.audience;
      if (textarea) {
        textarea.value = scenario.ticketText;
        const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
        const wordCountBadge = document.getElementById('ticketWordCount');
        if (wordCountBadge) wordCountBadge.textContent = `${words} words`;
      }

      // Also update Preview Paper with this scenario's details
      this.renderPreviewFromScenario(scenario);
    }

    handleFileUpload(files) {
      const docsList = document.getElementById('attachedDocsList');
      if (!docsList) return;

      Array.from(files).forEach(file => {
        const sizeStr = file.size > 1024 * 1024 
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
          : Math.round(file.size / 1024) + ' KB';

        const chip = document.createElement('div');
        chip.className = 'doc-chip';
        chip.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          </svg>
          <span class="doc-chip-name">${this.escapeHtml(file.name)}</span>
          <span class="doc-chip-size">${sizeStr}</span>
          <button type="button" class="doc-chip-remove" title="Remove attachment">&times;</button>
        `;
        docsList.appendChild(chip);

        // Also add to documentation repository
        const ext = file.name.split('.').pop().toUpperCase();
        this.docs.unshift({
          id: 'doc-' + Date.now(),
          name: file.name,
          type: ext === 'MD' ? 'Markdown' : ext,
          size: sizeStr,
          uploadDate: 'Today',
          status: 'Indexed',
          chunks: Math.floor(Math.random() * 120) + 20
        });
      });

      this.saveDocs();
      this.renderDocsTable();
      this.showToast(`Uploaded & indexed ${files.length} document(s) for RAG citations`);
    }

    clearGeneratorForm() {
      const titleInput = document.getElementById('articleTitleInput');
      const textarea = document.getElementById('ticketTextarea');
      const select = document.getElementById('sampleTemplateSelect');
      const wordCountBadge = document.getElementById('ticketWordCount');

      if (titleInput) titleInput.value = '';
      if (textarea) textarea.value = '';
      if (select) select.value = '';
      if (wordCountBadge) wordCountBadge.textContent = '0 words';

      this.showToast('Cleared input fields');
    }

    handleGenerateClick() {
      const title = document.getElementById('articleTitleInput').value.trim();
      const ticket = document.getElementById('ticketTextarea').value.trim();

      if (!title) {
        this.showToast('Please specify an Article Title', 'warning');
        document.getElementById('articleTitleInput').focus();
        return;
      }
      if (!ticket) {
        this.showToast('Please provide Resolved Ticket content', 'warning');
        document.getElementById('ticketTextarea').focus();
        return;
      }

      const generateBtn = document.getElementById('btnGenerateArticle');
      const progressBox = document.getElementById('generationProgressBox');
      const pStepTitle = document.getElementById('progressStepTitle');
      const pPct = document.getElementById('progressPercentage');
      const pFill = document.getElementById('progressBarFill');

      // Trigger Loading State
      generateBtn.classList.add('loading');
      generateBtn.disabled = true;
      progressBox.classList.add('show');

      // Step 1: 0ms -> 500ms
      pStepTitle.textContent = 'Parsing ticket logs & diagnostics...';
      pPct.textContent = '35%';
      pFill.style.width = '35%';

      setTimeout(() => {
        // Step 2: 500ms -> 1100ms
        pStepTitle.textContent = 'Cross-referencing technical documentation & runbooks (RAG)...';
        pPct.textContent = '72%';
        pFill.style.width = '72%';
        document.getElementById('pStep1')?.classList.add('done');
        document.getElementById('pStep2')?.classList.add('active');
      }, 500);

      setTimeout(() => {
        // Step 3: 1100ms -> 1600ms
        pStepTitle.textContent = 'Synthesizing standard ITIL KB structure & citations...';
        pPct.textContent = '100%';
        pFill.style.width = '100%';
        document.getElementById('pStep2')?.classList.add('done');
        document.getElementById('pStep3')?.classList.add('active');
      }, 1100);

      const cat = document.getElementById('articleCategorySelect')?.value || 'Network & VPN';
      const aud = document.getElementById('articleAudienceSelect')?.value || 'Tier 1/2 Support Engineers';

      // Send asynchronous generation request to Flask backend API
      fetch(`${this.getApiBaseUrl()}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_text: ticket,
          title: title,
          category: cat,
          audience: aud
        })
      })
      .then(res => res.json())
      .then(data => {
        setTimeout(() => {
          generateBtn.classList.remove('loading');
          generateBtn.disabled = false;
          progressBox.classList.remove('show');

          if (data && data.success && data.article) {
            this.renderPreviewFromBackend(data.article, cat);
            this.showToast(`Synthesized via Flask API + RAG (${data.rag_citations_count || 2} citations)`);
          } else {
            const activeScenario = this.currentScenario || SAMPLE_SCENARIOS['vpn-timeout'];
            this.renderPreviewFromCustom(title, cat, activeScenario);
            this.showToast('Knowledge Base Article synthesized successfully!');
          }

          // Visual highlight on preview paper
          const previewCard = document.getElementById('articlePreviewContainer');
          if (previewCard) {
            previewCard.style.outline = '2px solid var(--primary)';
            setTimeout(() => previewCard.style.outline = 'none', 1800);
          }

          // Add to activity timeline
          this.activities.unshift({
            type: 'generated',
            title: `Generated article: ${title.substring(0, 42)}...`,
            time: 'Just now',
            badge: 'AI Generated',
            color: '#4f46e5'
          });
          this.renderDashboard();
        }, 1600);
      })
      .catch(err => {
        console.warn('Backend API unavailable, using internal generator:', err);
        setTimeout(() => {
          generateBtn.classList.remove('loading');
          generateBtn.disabled = false;
          progressBox.classList.remove('show');

          const activeScenario = this.currentScenario || SAMPLE_SCENARIOS['vpn-timeout'];
          this.renderPreviewFromCustom(title, cat, activeScenario);

          const previewCard = document.getElementById('articlePreviewContainer');
          if (previewCard) {
            previewCard.style.outline = '2px solid var(--primary)';
            setTimeout(() => previewCard.style.outline = 'none', 1800);
          }

          this.activities.unshift({
            type: 'generated',
            title: `Generated article: ${title.substring(0, 42)}...`,
            time: 'Just now',
            badge: 'AI Generated',
            color: '#4f46e5'
          });
          this.renderDashboard();
          this.showToast('Knowledge Base Article synthesized successfully!');
        }, 1600);
      });
    }

    getApiBaseUrl() {
      if (window.location.port === '5000') {
        return '/api';
      }
      return 'http://localhost:5000/api';
    }

    async checkBackendHealth() {
      try {
        const res = await fetch(`${this.getApiBaseUrl()}/health`);
        if (res.ok) {
          const data = await res.json();
          const aiStatusEl = document.querySelector('.ai-status-sub');
          if (aiStatusEl) {
            aiStatusEl.textContent = `Backend Live: ${data.ai_engine}`;
          }
          const aiStatusText = document.querySelector('.ai-status-text');
          if (aiStatusText) {
            aiStatusText.textContent = 'API & RAG Engine';
          }
        }
      } catch (e) {
        // Standalone frontend mode
      }
    }

    renderPreviewFromBackend(art, category) {
      const previewTitle = document.getElementById('previewArticleTitle');
      const previewId = document.getElementById('articlePreviewId');
      const previewCat = document.getElementById('previewMetaCategory');
      const previewProb = document.getElementById('previewProblemDesc');
      const previewRoot = document.getElementById('previewRootCause');
      const previewSol = document.getElementById('previewSolution');
      const previewTrouble = document.getElementById('previewTroubleshooting');
      const previewRef = document.getElementById('previewReferences');

      if (previewTitle) previewTitle.textContent = art.title;
      if (previewId) previewId.textContent = `KB-${category.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      if (previewCat) previewCat.textContent = category;

      if (previewProb) previewProb.innerHTML = `<p>${this.escapeHtml(art.problem)}</p>`;
      if (previewRoot) previewRoot.innerHTML = `<p>${art.root_cause.replace(/\\n/g, '<br>')}</p>`;
      if (previewSol) previewSol.innerHTML = `<p>${this.escapeHtml(art.solution)}</p>`;

      if (previewTrouble && art.troubleshooting) {
        previewTrouble.innerHTML = `
          <div class="steps-container">
            ${art.troubleshooting.map(st => `
              <div class="step-card">
                <div class="step-num">${st.num}</div>
                <div class="step-body">
                  <h4 class="step-heading">${this.escapeHtml(st.heading)}</h4>
                  <p>${this.escapeHtml(st.desc)}</p>
                  ${st.code ? `
                    <div class="code-terminal">
                      <div class="terminal-bar">
                        <span>${st.codeLang || 'Terminal'}</span>
                        <button class="btn-copy-code" onclick="app.copyCodeSnippet(this)">Copy</button>
                      </div>
                      <pre><code>${this.escapeHtml(st.code)}</code></pre>
                    </div>
                  ` : ''}
                  ${st.hint ? `<small class="step-hint">${this.escapeHtml(st.hint)}</small>` : ''}
                  ${st.checklist ? `
                    <ul class="checklist">
                      ${st.checklist.map(item => `<li><label><input type="checkbox" checked> ${this.escapeHtml(item)}</label></li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (previewRef && art.citations) {
        previewRef.innerHTML = `
          <div class="citations-grid">
            ${art.citations.map(c => `
              <div class="citation-card">
                <div class="citation-header">
                  <span class="badge ${c.type.includes('Ticket') ? 'badge-ticket' : 'badge-doc'}">${c.type}</span>
                  <span class="citation-tag">${c.tag}</span>
                </div>
                <p class="citation-text">"${this.escapeHtml(c.text)}"</p>
                <small class="citation-meta">${this.escapeHtml(c.meta)}</small>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // -----------------------------------------------------------------------
    // Article Preview Section Logic (Requirement 4 & 6)
    // -----------------------------------------------------------------------
    initArticlePreview() {
      // Copy Article Button (Requirement 4)
      const copyBtn = document.getElementById('btnCopyArticle');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => this.copyCurrentArticleMarkdown());
      }

      // Download Article Button (Requirement 4)
      const downloadBtn = document.getElementById('btnDownloadArticle');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => this.downloadCurrentArticleMarkdown());
      }

      // Save Article to History
      const saveBtn = document.getElementById('btnSaveArticleToHistory');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.saveCurrentArticleToHistory());
      }
    }

    renderPreviewFromScenario(scenario) {
      const previewTitle = document.getElementById('previewArticleTitle');
      const previewId = document.getElementById('articlePreviewId');
      const previewCat = document.getElementById('previewMetaCategory');
      const previewProb = document.getElementById('previewProblemDesc');
      const previewRoot = document.getElementById('previewRootCause');
      const previewSol = document.getElementById('previewSolution');
      const previewTrouble = document.getElementById('previewTroubleshooting');
      const previewRef = document.getElementById('previewReferences');

      if (previewTitle) previewTitle.textContent = scenario.title;
      if (previewId) previewId.textContent = `KB-${scenario.category.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      if (previewCat) previewCat.textContent = scenario.category;
      
      if (previewProb) {
        previewProb.innerHTML = `
          <p>${this.escapeHtml(scenario.problem)}</p>
        `;
      }
      if (previewRoot) {
        previewRoot.innerHTML = `
          <p>${scenario.rootCause.replace(/\n/g, '<br>')}</p>
        `;
      }
      if (previewSol) {
        previewSol.innerHTML = `
          <p>${this.escapeHtml(scenario.solution)}</p>
        `;
      }

      if (previewTrouble && scenario.troubleshooting) {
        previewTrouble.innerHTML = `
          <div class="steps-container">
            ${scenario.troubleshooting.map(st => `
              <div class="step-card">
                <div class="step-num">${st.num}</div>
                <div class="step-body">
                  <h4 class="step-heading">${this.escapeHtml(st.heading)}</h4>
                  <p>${this.escapeHtml(st.desc)}</p>
                  ${st.code ? `
                    <div class="code-terminal">
                      <div class="terminal-bar">
                        <span>${st.codeLang || 'Terminal'}</span>
                        <button class="btn-copy-code" onclick="app.copyCodeSnippet(this)">Copy</button>
                      </div>
                      <pre><code>${this.escapeHtml(st.code)}</code></pre>
                    </div>
                  ` : ''}
                  ${st.hint ? `<small class="step-hint">${this.escapeHtml(st.hint)}</small>` : ''}
                  ${st.checklist ? `
                    <ul class="checklist">
                      ${st.checklist.map(item => `<li><label><input type="checkbox" checked> ${this.escapeHtml(item)}</label></li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (previewRef && scenario.citations) {
        previewRef.innerHTML = `
          <div class="citations-grid">
            ${scenario.citations.map(c => `
              <div class="citation-card">
                <div class="citation-header">
                  <span class="badge ${c.type.includes('Ticket') ? 'badge-ticket' : 'badge-doc'}">${c.type}</span>
                  <span class="citation-tag">${c.tag}</span>
                </div>
                <p class="citation-text">"${this.escapeHtml(c.text)}"</p>
                <small class="citation-meta">${this.escapeHtml(c.meta)}</small>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    renderPreviewFromCustom(title, category, baseScenario) {
      const previewTitle = document.getElementById('previewArticleTitle');
      const previewCat = document.getElementById('previewMetaCategory');
      if (previewTitle) previewTitle.textContent = title;
      if (previewCat) previewCat.textContent = category;
      this.renderPreviewFromScenario({
        ...baseScenario,
        title: title,
        category: category
      });
    }

    generateMarkdownString() {
      const title = document.getElementById('previewArticleTitle')?.textContent.trim() || 'Knowledge Base Article';
      const cat = document.getElementById('previewMetaCategory')?.textContent.trim() || 'General IT';
      const id = document.getElementById('articlePreviewId')?.textContent.trim() || 'KB-1001';
      const prob = document.getElementById('previewProblemDesc')?.innerText.trim() || '';
      const root = document.getElementById('previewRootCause')?.innerText.trim() || '';
      const sol = document.getElementById('previewSolution')?.innerText.trim() || '';
      const steps = document.getElementById('previewTroubleshooting')?.innerText.trim() || '';
      const refs = document.getElementById('previewReferences')?.innerText.trim() || '';

      return `# ${title}
**Article ID:** ${id} | **Category:** ${cat} | **Date:** ${new Date().toLocaleDateString()}
**Synthesized by:** CogniBase AI Engine

---

## 1. Problem Description
${prob}

---

## 2. Root Cause
${root}

---

## 3. Solution Summary
${sol}

---

## 4. Troubleshooting Steps
${steps}

---

## 5. References & Document Citations
${refs}
`;
    }

    copyCurrentArticleMarkdown() {
      const markdown = this.generateMarkdownString();
      navigator.clipboard.writeText(markdown).then(() => {
        this.showToast('Article copied to clipboard in Markdown format');
      }).catch(() => {
        this.fallbackCopy(markdown);
      });
    }

    downloadCurrentArticleMarkdown() {
      const title = document.getElementById('previewArticleTitle')?.textContent.trim() || 'KB_Article';
      const sanitizedName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 48);
      const markdown = this.generateMarkdownString();

      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedName}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast(`Downloaded ${sanitizedName}.md`);
    }

    saveCurrentArticleToHistory() {
      const title = document.getElementById('previewArticleTitle')?.textContent.trim() || 'Untitled Article';
      const category = document.getElementById('previewMetaCategory')?.textContent.trim() || 'Network & VPN';
      const id = document.getElementById('articlePreviewId')?.textContent.trim() || `KB-${Date.now()}`;

      // Check if already in list
      const existing = this.articles.find(a => a.id === id);
      if (existing) {
        this.showToast('Article already exists in Article History');
        return;
      }

      this.articles.unshift({
        id: id,
        title: title,
        sourceTicket: 'INC-' + Math.floor(10000 + Math.random() * 89999),
        category: category,
        date: 'Today',
        reviewer: 'Alex Rivera (SME)',
        status: 'Draft',
        scenarioKey: 'vpn-timeout'
      });

      this.saveArticles();
      this.renderHistoryTable();
      this.renderDashboard();
      this.showToast('Article saved to Article History');
    }

    // -----------------------------------------------------------------------
    // Article History Logic (Requirement 5)
    // -----------------------------------------------------------------------
    initHistory() {
      const filterInput = document.getElementById('historyFilterInput');
      const catSelect = document.getElementById('historyFilterCategory');
      const statusSelect = document.getElementById('historyFilterStatus');

      if (filterInput) filterInput.addEventListener('input', () => this.renderHistoryTable());
      if (catSelect) catSelect.addEventListener('change', () => this.renderHistoryTable());
      if (statusSelect) statusSelect.addEventListener('change', () => this.renderHistoryTable());
    }

    renderHistoryTable() {
      const tbody = document.getElementById('historyTableBody');
      const counterBadge = document.getElementById('historyCounterBadge');
      if (!tbody) return;

      const query = (document.getElementById('historyFilterInput')?.value || '').toLowerCase().trim();
      const catFilter = document.getElementById('historyFilterCategory')?.value || 'all';
      const statusFilter = document.getElementById('historyFilterStatus')?.value || 'all';

      const filtered = this.articles.filter(art => {
        const matchesQuery = !query || 
          art.title.toLowerCase().includes(query) || 
          art.id.toLowerCase().includes(query) ||
          art.sourceTicket.toLowerCase().includes(query);
        const matchesCat = catFilter === 'all' || art.category === catFilter;
        const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
        return matchesQuery && matchesCat && matchesStatus;
      });

      if (counterBadge) counterBadge.textContent = this.articles.length.toString();

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
              No knowledge base articles match your filter criteria.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(art => `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(art.title)}</div>
            <small style="color: var(--text-muted); font-family: var(--font-mono);">${art.id} • Ref: ${art.sourceTicket}</small>
          </td>
          <td><span class="badge badge-neutral">${art.category}</span></td>
          <td><span style="font-size: 0.84rem; color: var(--text-secondary);">${art.date}</span></td>
          <td>${this.getStatusBadgeHtml(art.status)}</td>
          <td>
            <!-- View Button (Requirement 5) -->
            <button class="btn btn-secondary btn-sm" onclick="app.viewArticleModal('${art.id}')">
              View
            </button>
          </td>
        </tr>
      `).join('');
    }

    // -----------------------------------------------------------------------
    // Documentation Page Logic (Requirement 6)
    // -----------------------------------------------------------------------
    initDocumentation() {
      const uploadDocBtn = document.getElementById('btnUploadDocModal');
      const uploadModal = document.getElementById('uploadDocModal');
      const closeModal = document.getElementById('uploadDocModalCloseBtn');
      const cancelModal = document.getElementById('modalCancelDocBtn');
      const confirmUpload = document.getElementById('modalConfirmUploadBtn');

      if (uploadDocBtn && uploadModal) {
        uploadDocBtn.addEventListener('click', () => uploadModal.classList.add('show'));
      }
      if (closeModal && uploadModal) {
        closeModal.addEventListener('click', () => uploadModal.classList.remove('show'));
      }
      if (cancelModal && uploadModal) {
        cancelModal.addEventListener('click', () => uploadModal.classList.remove('show'));
      }

      if (confirmUpload) {
        confirmUpload.addEventListener('click', () => {
          const docName = document.getElementById('modalDocName')?.value.trim();
          const docType = document.getElementById('modalDocType')?.value || 'PDF';

          if (!docName) {
            this.showToast('Please enter a document name', 'warning');
            return;
          }

          this.docs.unshift({
            id: 'doc-' + Date.now(),
            name: docName,
            type: docType,
            size: '1.4 MB',
            uploadDate: 'Today',
            status: 'Indexed',
            chunks: 240
          });

          this.saveDocs();
          this.renderDocsTable();
          this.renderDashboard();
          uploadModal.classList.remove('show');
          this.showToast(`Document "${docName}" uploaded and indexed`);
          document.getElementById('modalDocName').value = '';
        });
      }
    }

    renderDocsTable() {
      const tbody = document.getElementById('docsTableBody');
      const badge = document.getElementById('docCountBadge');
      const counterBadge = document.getElementById('docsCounterBadge');

      if (!tbody) return;

      if (badge) badge.textContent = `${this.docs.length} Documents`;
      if (counterBadge) counterBadge.textContent = this.docs.length.toString();

      tbody.innerHTML = this.docs.map(doc => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              </svg>
              <strong style="font-size: 0.88rem;">${this.escapeHtml(doc.name)}</strong>
            </div>
          </td>
          <td><span class="badge badge-neutral">${doc.type}</span></td>
          <td><span style="font-size: 0.82rem; color: var(--text-muted);">${doc.size}</span></td>
          <td><span style="font-size: 0.84rem; color: var(--text-secondary);">${doc.uploadDate}</span></td>
          <td><span class="badge badge-success">${doc.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="app.showToast('Document chunk inspection: 100% vector embedded')">
              Preview
            </button>
          </td>
        </tr>
      `).join('');
    }

    // -----------------------------------------------------------------------
    // Settings Page Logic (Requirement 7)
    // -----------------------------------------------------------------------
    initSettings() {
      const saveSettingsBtn = document.getElementById('btnSaveAllSettings');
      if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
          this.showToast('Workspace settings saved successfully');
        });
      }

      const resetDataBtn = document.getElementById('btnResetAllDemoData');
      if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
          localStorage.removeItem('kb_articles');
          localStorage.removeItem('kb_docs');
          this.articles = [...INITIAL_ARTICLES];
          this.docs = [...INITIAL_DOCS];
          this.renderAll();
          this.showToast('Restored default demo state');
        });
      }
    }

    // -----------------------------------------------------------------------
    // Global Search & Keyboard Shortcut (Ctrl + K)
    // -----------------------------------------------------------------------
    initGlobalSearch() {
      const searchInput = document.getElementById('globalSearchInput');
      const dropdown = document.getElementById('searchResultsDropdown');
      const list = document.getElementById('searchResultsList');

      if (!searchInput || !dropdown || !list) return;

      // Keyboard Shortcut Ctrl+K / Cmd+K
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          searchInput.focus();
        }
      });

      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (!val) {
          dropdown.classList.remove('show');
          return;
        }

        const matches = this.articles.filter(a => 
          a.title.toLowerCase().includes(val) || 
          a.category.toLowerCase().includes(val) ||
          a.id.toLowerCase().includes(val)
        );

        if (matches.length === 0) {
          list.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); font-size: 0.84rem;">No matching articles found.</div>`;
        } else {
          list.innerHTML = matches.map(m => `
            <div class="search-item" onclick="app.viewArticleModal('${m.id}')">
              <div class="search-item-info">
                <span class="search-item-title">${this.escapeHtml(m.title)}</span>
                <span class="search-item-cat">${m.id} • ${m.category}</span>
              </div>
              <span class="badge badge-neutral">View</span>
            </div>
          `).join('');
        }
        dropdown.classList.add('show');
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !searchInput.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });
    }

    // -----------------------------------------------------------------------
    // Modals Management
    // -----------------------------------------------------------------------
    initModals() {
      const articleModal = document.getElementById('articleModal');
      const closeBtn = document.getElementById('modalCloseBtn');
      const doneBtn = document.getElementById('modalDoneBtn');
      const copyBtn = document.getElementById('modalCopyBtn');

      if (closeBtn && articleModal) {
        closeBtn.addEventListener('click', () => articleModal.classList.remove('show'));
      }
      if (doneBtn && articleModal) {
        doneBtn.addEventListener('click', () => articleModal.classList.remove('show'));
      }
      if (articleModal) {
        articleModal.addEventListener('click', (e) => {
          if (e.target === articleModal) articleModal.classList.remove('show');
        });
      }
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.copyCurrentArticleMarkdown();
        });
      }
    }

    viewArticleModal(articleId) {
      const art = this.articles.find(a => a.id === articleId);
      if (!art) return;

      const scenario = SAMPLE_SCENARIOS[art.scenarioKey] || SAMPLE_SCENARIOS['vpn-timeout'];

      const modalId = document.getElementById('modalArticleId');
      const modalCat = document.getElementById('modalArticleCategory');
      const modalBody = document.getElementById('modalArticleContent');

      if (modalId) modalId.textContent = art.id;
      if (modalCat) modalCat.textContent = art.category;

      if (modalBody) {
        modalBody.innerHTML = `
          <h2 style="font-size: 1.45rem; margin-bottom: 0.85rem; color: var(--text-primary);">${this.escapeHtml(art.title)}</h2>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;">
            Source Ticket: <strong>${art.sourceTicket}</strong> • Status: <strong>${art.status}</strong> • Reviewed by: <strong>${art.reviewer}</strong>
          </div>

          <div class="kb-section">
            <h4 class="kb-section-title">Problem Description</h4>
            <p>${this.escapeHtml(scenario.problem)}</p>
          </div>

          <div class="kb-section">
            <h4 class="kb-section-title">Root Cause</h4>
            <p>${scenario.rootCause.replace(/\n/g, '<br>')}</p>
          </div>

          <div class="kb-section">
            <h4 class="kb-section-title">Solution</h4>
            <p>${this.escapeHtml(scenario.solution)}</p>
          </div>

          <div class="kb-section">
            <h4 class="kb-section-title">Troubleshooting Steps</h4>
            <ol style="padding-left: 1.25rem;">
              ${scenario.troubleshooting.map(s => `<li style="margin-bottom: 0.5rem;"><strong>${this.escapeHtml(s.heading)}:</strong> ${this.escapeHtml(s.desc)}</li>`).join('')}
            </ol>
          </div>
        `;
      }

      document.getElementById('articleModal').classList.add('show');
    }

    // -----------------------------------------------------------------------
    // UI Helpers & Utilities
    // -----------------------------------------------------------------------
    renderAll() {
      this.renderDashboard();
      this.renderHistoryTable();
      this.renderDocsTable();
    }

    saveArticles() {
      localStorage.setItem('kb_articles', JSON.stringify(this.articles));
    }

    saveDocs() {
      localStorage.setItem('kb_docs', JSON.stringify(this.docs));
    }

    showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <span style="color: #38bdf8;">✓</span>
        <span>${this.escapeHtml(message)}</span>
      `;
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 250);
      }, 3000);
    }

    copyCodeSnippet(btn) {
      const pre = btn.closest('.code-terminal').querySelector('pre code');
      if (!pre) return;

      navigator.clipboard.writeText(pre.innerText).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 1800);
        this.showToast('Code snippet copied to clipboard');
      });
    }

    getStatusBadgeHtml(status) {
      if (status === 'Published') return `<span class="badge badge-success">${status}</span>`;
      if (status === 'Pending Review') return `<span class="badge badge-warning">${status}</span>`;
      return `<span class="badge badge-neutral">${status}</span>`;
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('Copied to clipboard');
    }
  }

  // Instantiate application globally
  window.app = new App();

})();
