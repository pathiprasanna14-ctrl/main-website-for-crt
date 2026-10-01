# Cisco ASA & AnyConnect Client Architecture Guide (v4.2)
## Section 4: Path MTU Discovery and DTLS Handshake Tuning
When AnyConnect clients encounter DTLS handshake failure or Error 412, intermediate transit routers are often dropping ICMP Type 3 Code 4 fragmentation requests.
The default MTU on AnyConnect virtual adapter is 1500 bytes. In carrier environments with MPLS or PPPoE encapsulation, the effective Path MTU drops to 1380-1420 bytes.

### Remediation Steps
1. Apply MTU clamping on the ASA group-policy:
   group-policy Enterprise-Remote-Users attributes
     mtu 1360
     sysopt connection tcpmss 1360
2. Ensure dynamic Path MTU is enabled in client Profile.xml:
   <ClientInitialization>
     <MTU>1360</MTU>
     <DynamicPathMTU>true</DynamicPathMTU>
   </ClientInitialization>
