"""
RAG (Retrieval-Augmented Generation) Module for AI Knowledge Base Generator.
Handles parsing, chunking, and similarity retrieval across technical documentation.
"""

import os
import re
import math
from typing import List, Dict, Any, Optional

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None


class RAGPipeline:
    def __init__(self, documents_dir: Optional[str] = None):
        self.documents_dir = documents_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'documents')
        self.chunks: List[Dict[str, Any]] = []
        self.indexed_docs: List[Dict[str, Any]] = []
        os.makedirs(self.documents_dir, exist_ok=True)
        self.load_and_index_documents()

    def load_and_index_documents(self):
        """Indexes all documents in the documents folder."""
        self.chunks.clear()
        self.indexed_docs.clear()

        # Seed with initial standard ITIL runbooks if folder is empty
        self._ensure_sample_documents()

        if not os.path.exists(self.documents_dir):
            return

        for fname in os.listdir(self.documents_dir):
            fpath = os.path.join(self.documents_dir, fname)
            if os.path.isfile(fpath):
                self._index_file(fpath, fname)

    def _ensure_sample_documents(self):
        """Creates sample technical documents if none exist."""
        samples = {
            'Cisco_ASA_AnyConnect_Config_v4.2.md': """# Cisco ASA & AnyConnect Client Architecture Guide (v4.2)
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
""",
            'PostgreSQL_High_Availability_Runbook.md': """# PostgreSQL High Availability & Standby Replication Runbook
## Chapter 4: Mitigating Standby Recovery Conflicts
Read replicas configured with hot standby can experience replication lag when long-running read queries hold snapshots on rows that the primary instance has already vacuumed or modified.

### Key Configuration Parameters
- hot_standby_feedback = on: Informs the primary of standby read requirements, preventing premature dead row cleanup.
- max_standby_streaming_delay = 60s: Allows replication to proceed after delay threshold.
- Partition high-frequency write tables to limit vacuum lock contention.
""",
            'Kubernetes_Production_Resource_Quotas.md': """# Kubernetes Production Resource Quotas & OOM Management
## Section 6: Cgroup OOM Killer and Memory Allocator Limits
Containers reaching their memory limit are terminated by the Linux cgroup driver with Exit Code 137 (OOMKilled).
For Go-based microservices, set GOMEMLIMIT environment variable to 90% of container memory limit to trigger garbage collection before the kernel cgroup boundary is reached.
"""
        }

        for name, content in samples.items():
            path = os.path.join(self.documents_dir, name)
            if not os.path.exists(path):
                try:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                except Exception as e:
                    print(f"Warning: could not write seed document {name}: {e}")

    def _index_file(self, fpath: str, fname: str):
        """Extracts text and chunks a single document file."""
        text = self._extract_text(fpath)
        if not text:
            return

        size_kb = os.path.getsize(fpath) / 1024
        size_str = f"{size_kb / 1024:.1f} MB" if size_kb > 1024 else f"{int(size_kb)} KB"
        ext = os.path.splitext(fname)[1].lstrip('.').upper() or 'TXT'

        # Split into semantic paragraph chunks
        raw_chunks = [c.strip() for c in re.split(r'\n{2,}', text) if len(c.strip()) > 60]
        
        doc_record = {
            'id': f"doc-{len(self.indexed_docs) + 1}",
            'name': fname,
            'type': ext,
            'size': size_str,
            'chunks_count': len(raw_chunks),
            'status': 'Indexed'
        }
        self.indexed_docs.append(doc_record)

        for idx, chunk in enumerate(raw_chunks):
            # Extract possible section heading
            heading_match = re.search(r'^(#+\s+[^\n]+)', chunk)
            heading = heading_match.group(1).replace('#', '').strip() if heading_match else f"Section {idx + 1}"

            self.chunks.append({
                'doc_id': doc_record['id'],
                'doc_name': fname,
                'chunk_id': f"{doc_record['id']}-c{idx}",
                'heading': heading,
                'content': chunk,
                'tokens': self._tokenize(chunk)
            })

    def _extract_text(self, fpath: str) -> str:
        """Extracts raw text based on file format."""
        ext = os.path.splitext(fpath)[1].lower()
        try:
            if ext in ['.md', '.txt', '.json', '.xml', '.yaml', '.yml']:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()

            elif ext == '.pdf' and pypdf:
                reader = pypdf.PdfReader(fpath)
                return "\n\n".join([page.extract_text() or '' for page in reader.pages])

            elif ext in ['.docx', '.doc'] and docx:
                doc = docx.Document(fpath)
                return "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])

            else:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
        except Exception as e:
            print(f"Error extracting {fpath}: {e}")
            return ""

    def _tokenize(self, text: str) -> set:
        """Tokenizes text into normalized keywords."""
        words = re.findall(r'[a-zA-Z0-9_\-\.]{3,}', text.lower())
        stopwords = {'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'were', 'which', 'their'}
        return {w for w in words if w not in stopwords}

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves the top_k most relevant chunks using keyword overlap and TF-IDF style scoring.
        """
        if not self.chunks:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return self.chunks[:top_k]

        scored_chunks = []
        for chunk in self.chunks:
            intersection = query_tokens.intersection(chunk['tokens'])
            score = len(intersection)

            # Extra weight for error codes or technical keywords
            for token in query_tokens:
                if re.match(r'^(err|inc|mtu|tcp|ip|vpn|sql|oom|\d{3,})', token):
                    if token in chunk['tokens']:
                        score += 3

            if score > 0:
                confidence = min(99.4, 75.0 + (score * 4.5))
                scored_chunks.append({
                    'doc_name': chunk['doc_name'],
                    'heading': chunk['heading'],
                    'content': chunk['content'],
                    'score': score,
                    'confidence': round(confidence, 1)
                })

        scored_chunks.sort(key=lambda x: x['score'], reverse=True)
        return scored_chunks[:top_k]
