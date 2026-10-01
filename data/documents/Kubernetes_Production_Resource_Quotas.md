# Kubernetes Production Resource Quotas & OOM Management
## Section 6: Cgroup OOM Killer and Memory Allocator Limits
Containers reaching their memory limit are terminated by the Linux cgroup driver with Exit Code 137 (OOMKilled).
For Go-based microservices, set GOMEMLIMIT environment variable to 90% of container memory limit to trigger garbage collection before the kernel cgroup boundary is reached.
