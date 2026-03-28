"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { lineOfBusinessApiService } from "@/services/lineOfBusinessApiService";
import { 
    Home, ChevronRight, Search, Filter, List, Grid, Plus, X, 
    ChevronDown, User, Database, Layers, AlertCircle, Pencil, 
    Trash2, Link, MoreVertical, LayoutDashboard, FolderTree 
} from "lucide-react";
import { 
    useGetAllLineOfBusiness, 
    useGetLobOwners, 
    useGetLobDomainsForSelection, 
    useGetLobCatalogs 
} from "@/hooks/useLineOfBusinessQueries";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExternalLink {
    label: string;
    url: string;
}

interface Subdomain {
    id: string;
    name: string;
    assets: number;
    owner?: string;
    description?: string;
    externalLinks?: ExternalLink[];
}

interface Domain {
    id: string;
    name: string;
    description: string;
    owner: string;
    color: string;
    assets: number;
    subdomains: Subdomain[];
    externalLinks?: ExternalLink[];
    createdAt?: string;
}

interface SelectedItem {
    type: "domain" | "subdomain";
    id: string;
    parentId?: string;
}

interface ModalForm {
    name: string;
    description: string;
    owner: string;
    color: string;
    customId: string;
    catalogId?: string;
}

interface EditForm {
    name: string;
    description: string;
    owner: string;
    color: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const OWNERS = [
    "analytics-team@company.com",
    "compliance@company.com",
    "data-infra@company.com",
    "eng-lead@company.com",
    "finance-vp@company.com",
    "marketing-lead@company.com",
    "mlops-team@company.com",
    "revops@company.com",
    "secops@company.com",
];

const COLOR_OPTIONS = [
    "#4F63F7",
    "#22C55E",
    "#EC4899",
    "#A855F7",
    "#EF4444",
    "#F59E0B",
    "#6366F1",
    "#14B8A6",
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ColorDot({ color, size = 12 }: { color: string; size?: number }) {
    return (
        <span
            className="inline-block rounded-full flex-shrink-0"
            style={{ width: size, height: size, backgroundColor: color }}
        />
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
            {children}
        </p>
    );
}

function Breadcrumb() {
    const router = useRouter();
    return (
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-3" aria-label="Breadcrumb">
            <Home className="w-3.5 h-3.5" />
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push("/")}>Home</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="hover:text-gray-700">Governance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Line of Business</span>
        </nav>
    );
}

// ─── Domain Card (Grid View) ──────────────────────────────────────────────────

function DomainCard({ domain }: { domain: Domain }) {
    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
                <ColorDot color={domain.color} size={14} />
                <h3 className="text-base font-semibold text-gray-900">{domain.name}</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">{domain.description}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[130px]" title={domain.owner}>{domain.owner}</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    {domain.assets.toLocaleString()} assets
                </span>
                {domain.subdomains.length > 0 && (
                    <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {domain.subdomains.length} sub-domain{domain.subdomains.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>
            {domain.subdomains.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                    {domain.subdomains.map((sd) => (
                        <span key={sd.id} className="text-xs border border-gray-300 rounded-md px-2.5 py-1 text-gray-600 bg-gray-50">
                            {sd.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Domain Row (List View) ───────────────────────────────────────────────────

function DomainRow({
    domain,
    expanded,
    selected,
    selectedSubdomainId,
    onToggle,
    onSelect,
    onSelectSubdomain,
    onEditDomain,
    onDeleteDomain,
}: {
    domain: Domain;
    expanded: boolean;
    selected: boolean;
    selectedSubdomainId?: string;
    onToggle: () => void;
    onSelect: () => void;
    onSelectSubdomain: (sdId: string) => void;
    onEditDomain: () => void;
    onDeleteDomain: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div>
            <div
                className={`relative flex items-center justify-between pr-4 py-3 cursor-pointer group transition-colors ${selected
                    ? "bg-indigo-50 border-l-4 border-indigo-500 pl-3"
                    : "border-l-4 border-transparent pl-4 hover:bg-gray-50"
                    }`}
                onClick={onSelect}
                role="button"
                aria-expanded={expanded}
                aria-pressed={selected}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") onSelect(); }}
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-0.5 rounded hover:bg-gray-200"
                        aria-label={expanded ? "Collapse" : "Expand"}
                    >
                        {domain.subdomains.length > 0 ? (
                            expanded
                                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                        ) : (
                            <span className="w-4 h-4 inline-block" />
                        )}
                    </button>
                    <ColorDot color={domain.color} size={12} />
                    <span className={`text-sm font-semibold ${selected ? "text-indigo-700" : "text-gray-900"}`}>
                        {domain.name}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{domain.assets.toLocaleString()} assets</span>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                            className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            aria-label="More options"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-8 z-30 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-32">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEditDomain(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDeleteDomain(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {expanded && domain.subdomains.map((sd) => {
                const isSelectedSd = selectedSubdomainId === sd.id;
                return (
                    <div
                        key={sd.id}
                        className={`flex items-center justify-between pr-4 py-2.5 cursor-pointer group transition-colors ${isSelectedSd
                            ? "bg-indigo-50 border-l-4 border-indigo-500 pl-11"
                            : "border-l-4 border-transparent pl-12 hover:bg-gray-50"
                            }`}
                        onClick={() => onSelectSubdomain(sd.id)}
                        role="button"
                        aria-pressed={isSelectedSd}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") onSelectSubdomain(sd.id); }}
                    >
                        <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${isSelectedSd ? "bg-indigo-400" : "bg-gray-300"}`} />
                            <span className={`text-sm ${isSelectedSd ? "text-indigo-700 font-medium" : "text-gray-600"}`}>{sd.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">{sd.assets.toLocaleString()} assets</span>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                                aria-label="More options"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Details Panel ────────────────────────────────────────────────────────────

function DetailsPanel({
    panelOpen,
    domains,
    selectedItem,
    onClose,
    onUpdate,
    onDelete,
}: {
    panelOpen: boolean;
    domains: Domain[];
    selectedItem: SelectedItem;
    onClose: () => void;
    onUpdate: (updated: Domain[]) => void;
    onDelete: (domainId: string) => void;
}) {
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>({ name: "", description: "", owner: "", color: "" });

    const domain = domains.find((d) =>
        selectedItem.type === "domain" ? d.id === selectedItem.id : d.id === selectedItem.parentId
    );
    const subdomain =
        selectedItem.type === "subdomain" && domain
            ? domain.subdomains.find((sd) => sd.id === selectedItem.id)
            : null;

    if (!domain) return null;

    const isSubdomain = selectedItem.type === "subdomain" && !!subdomain;
    const displayColor = domain.color;
    const displayName = isSubdomain ? subdomain!.name : domain.name;

    const startEdit = () => {
        setEditForm({
            name: isSubdomain ? subdomain!.name : domain.name,
            description: isSubdomain ? (subdomain!.description ?? "") : domain.description,
            owner: isSubdomain ? (subdomain!.owner ?? "") : domain.owner,
            color: domain.color,
        });
        setEditMode(true);
    };

    const cancelEdit = () => setEditMode(false);

    const saveChanges = () => {
        const updated = domains.map((d) => {
            if (d.id !== domain.id) return d;
            if (isSubdomain) {
                return {
                    ...d,
                    subdomains: d.subdomains.map((sd) =>
                        sd.id === subdomain!.id
                            ? { ...sd, name: editForm.name, description: editForm.description, owner: editForm.owner }
                            : sd
                    ),
                };
            }
            return { ...d, name: editForm.name, description: editForm.description, owner: editForm.owner, color: editForm.color };
        });
        onUpdate(updated);
        setEditMode(false);
    };

    // ── Edit mode ──
    if (editMode) {
        return (
            <div className={cn("flex flex-col border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm")}>
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 flex-1 mr-2">
                        <ColorDot color={editForm.color} size={12} />
                        <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="flex-1 text-base font-semibold text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
                        />
                    </div>
                    <button onClick={cancelEdit} className="p-1.5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0" aria-label="Close">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />

                    {!isSubdomain && (
                        <div>
                            <SectionLabel>Color</SectionLabel>
                            <div className="flex gap-2 flex-wrap">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setEditForm({ ...editForm, color: c })}
                                        className={`w-7 h-7 rounded-full focus:outline-none transition-transform ${editForm.color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"}`}
                                        style={{ backgroundColor: c }}
                                        aria-label={`Color ${c}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <SectionLabel>Owner</SectionLabel>
                        <input
                            value={editForm.owner}
                            onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <SectionLabel>Asset Count</SectionLabel>
                        <div className="flex items-center gap-1.5 text-indigo-600 text-sm font-medium">
                            <Database className="w-4 h-4" />
                            {isSubdomain ? subdomain!.assets : domain.assets} assets
                        </div>
                    </div>

                    {!isSubdomain && domain.subdomains.length > 0 && (
                        <div>
                            <SectionLabel>Sub-Domains</SectionLabel>
                            <ul className="flex flex-col gap-1.5">
                                {domain.subdomains.map((sd) => (
                                    <li key={sd.id} className="flex items-center gap-2 text-sm text-gray-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block flex-shrink-0" />
                                        {sd.name} <span className="text-gray-400">({sd.assets})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <SectionLabel>External Links</SectionLabel>
                        {(isSubdomain ? subdomain!.externalLinks ?? [] : domain.externalLinks ?? []).map((link, i) => (
                            <a key={i} href={link.url} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                                <Link className="w-3.5 h-3.5 flex-shrink-0" /> {link.label}
                            </a>
                        ))}
                        <button className="mt-1.5 text-sm text-indigo-600 hover:underline flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Add Link
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-2">
                    <button onClick={cancelEdit} className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Cancel
                    </button>
                    <button onClick={saveChanges} className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Save Changes
                    </button>
                </div>
            </div>
        );
    }

    // ── View mode ──
    return (
        <div className={cn("flex flex-col border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm", panelOpen ? "rounded-tl-none rounded-bl-none rounded-tr-lg rounded-br-lg" : "")}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <div className="flex flex-col justify-center items-start gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <ColorDot color={displayColor} size={12} />
                        <h2 className="text-base font-medium text-gray-900 truncate">{displayName}</h2>
                    </div>
                    {isSubdomain && (
                        <div className="flex items-center">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Sub-domain</span>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0 ml-2" aria-label="Close panel">
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] px-4 py-2 flex flex-col gap-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                    {isSubdomain ? (subdomain!.description || "No description.") : domain.description}
                </p>

                <div>
                    <SectionLabel>Owner</SectionLabel>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {isSubdomain ? (subdomain!.owner || "—") : domain.owner}
                    </div>
                </div>

                <div>
                    <SectionLabel>Asset Count</SectionLabel>
                    <div className="flex items-center gap-1.5 text-indigo-600 text-sm font-medium">
                        <Database className="w-4 h-4" />
                        {isSubdomain ? subdomain!.assets : domain.assets} assets
                    </div>
                </div>

                {!isSubdomain && (
                    <div>
                        <SectionLabel>Sub-Domains</SectionLabel>
                        {domain.subdomains.length > 0 ? (
                            <ul className="flex flex-col gap-1.5">
                                {domain.subdomains.map((sd) => (
                                    <li key={sd.id} className="flex items-center gap-2 text-sm text-gray-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block flex-shrink-0" />
                                        {sd.name} <span className="text-gray-400">({sd.assets})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400">No sub-domains.</p>
                        )}
                    </div>
                )}

                <div>
                    <SectionLabel>External Links</SectionLabel>
                    {(isSubdomain ? subdomain!.externalLinks ?? [] : domain.externalLinks ?? []).length > 0 ? (
                        (isSubdomain ? subdomain!.externalLinks! : domain.externalLinks!).map((link, i) => (
                            <a key={i} href={link.url} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                                <Link className="w-3.5 h-3.5 flex-shrink-0" /> {link.label}
                            </a>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400">No links added.</p>
                    )}
                </div>

                {!isSubdomain && (
                    <>
                        <div>
                            <SectionLabel>Domain ID</SectionLabel>
                            <code className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono">
                                {domain.id}
                            </code>
                        </div>
                        {domain.createdAt && (
                            <div>
                                <SectionLabel>Created</SectionLabel>
                                <p className="text-sm text-gray-700">
                                    {new Date(domain.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex gap-2">
                    <button
                        onClick={startEdit}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <Link className="w-3 h-3" /> Assign Assets
                    </button>
                </div>
                <button
                    onClick={() => onDelete(domain.id)}
                    className="flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-md hover:bg-red-50"
                >
                    <Trash2 className="w-3 h-3" /> Delete domain
                </button>
            </div>
        </div>
    );
}

// ─── Create Domain Modal ──────────────────────────────────────────────────────

function CreateDomainModal({ onClose, onCreate }: { onClose: () => void; onCreate: (form: ModalForm) => void }) {
    const [form, setForm] = useState<ModalForm>({ name: "", description: "", owner: "", color: COLOR_OPTIONS[0], customId: "", catalogId: "" });
    const [advancedOpen, setAdvancedOpen] = useState(false);
    
    const { data: owners = [], isLoading: loadingOwners } = useGetLobOwners(100);
    const { data: parentDomains = [], isLoading: loadingDomains } = useGetLobDomainsForSelection();
    const { data: catalogs = [], isLoading: loadingCatalogs } = useGetLobCatalogs();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!form.name.trim()) {
            setError("Name is required");
            return;
        }
        if (!form.owner) {
            setError("Owner is required");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Find the selected owner to get their name
            const selectedOwner = owners.find((o) => o.id === form.owner);
            const ownerName = selectedOwner?.name || form.owner;

            // Find the selected parent domain to get its name
            const selectedParentDomain = parentDomains.find((d) => d.id === form.customId);
            const parentDomainName = selectedParentDomain?.name || form.customId || undefined;

            const payload = {
                name: form.name,
                description: form.description,
                owner: ownerName,
                color: form.color,
                custom_domain_name: parentDomainName || undefined,
                ...(form.catalogId && { catalog_id: form.catalogId }),
            };

            const created = await lineOfBusinessApiService.createLineOfBusiness(payload);

            onCreate(form);
            onClose();
        } catch (err: any) {
            console.error("Failed to create domain:", err);
            setError(err.message || "Failed to create domain. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" aria-label="New Domain">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md mx-4 px-4 py-2 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">New Line of Business</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Close modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-800">Name <span className="text-red-500">*</span></label>
                    <Input type="text" placeholder="e.g. Platform Engineering" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(null); }} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-800">Description</label>
                    <textarea rows={3} value={form.description} placeholder="Enter description" onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-800">Owner <span className="text-red-500">*</span></label>
                    {loadingOwners ? (
                        <div className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                            Loading owners...
                        </div>
                    ) : (
                        <Select
                            value={form.owner}
                            onChange={(e) => { setForm({ ...form, owner: e.target.value }); setError(null); }}
                            className="bg-white"
                            options={[
                                { value: "", label: "Select an owner..." },
                                ...owners.map((owner) => ({
                                    value: owner.id,
                                    label: `${owner.name} (${owner.email})`
                                }))
                            ]}
                        />
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-800">Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {COLOR_OPTIONS.map((c) => (
                            <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-5 h-5 rounded-full focus:outline-none transition-transform ${form.color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"}`} style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={() => setAdvancedOpen((v) => !v)} className="flex items-center gap-1.5 text-slate-500 text-sm font-medium focus:outline-none rounded-md w-fit" aria-expanded={advancedOpen}>
                        {advancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Advanced
                    </button>
                    {advancedOpen && (
                        <div className="border-l-2 border-gray-200 px-4 py-3 flex flex-col gap-4 ml-2">
                            <div>
                                <label className="text-sm font-medium text-gray-800">Parent Domain <span className="text-gray-400 text-xs">(Optional)</span></label>
                                <p className="text-xs text-gray-500 mb-2">Choose an existing domain as parent for this sub-domain</p>
                                {loadingDomains ? (
                                    <div className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                                        Loading domains...
                                    </div>
                                ) : (
                                    <Select
                                        value={form.customId}
                                        onChange={(e) => setForm({ ...form, customId: e.target.value })}
                                        className="w-full bg-white"
                                        options={[
                                            { value: "", label: "None (Top-level domain)" },
                                            ...parentDomains.map((domain) => ({
                                                value: domain.id,
                                                label: `${domain.name} (${domain.owner})`
                                            }))
                                        ]}
                                    />
                                )}
                                <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    Select a parent domain to create this as a sub-domain.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-800">Catalog <span className="text-gray-400 text-xs">(Optional)</span></label>
                                <p className="text-xs text-gray-500 mb-2">Assign a catalog to this domain</p>
                                {loadingCatalogs ? (
                                    <div className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                                        Loading catalogs...
                                    </div>
                                ) : catalogs && catalogs.length > 0 ? (
                                    <Select
                                        value={form.catalogId || ""}
                                        onChange={(e) => setForm({ ...form, catalogId: e.target.value })}
                                        className="w-full bg-white"
                                        options={[
                                            { value: "", label: "None (No catalog)" },
                                            ...catalogs.map((catalog) => ({
                                                value: catalog.id,
                                                label: `${catalog.full_name || `${catalog.schema_name}.${catalog.table_name}` || catalog.table_name || catalog.id} (${catalog.source_name || "Unknown"})`
                                            }))
                                        ]}
                                    />
                                ) : (
                                    <div className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                                        No catalogs available
                                    </div>
                                )}
                                <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    Select a catalog to associate with this domain. This can be updated later.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 py-2">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">Cancel</button>
                    <button onClick={handleCreate} disabled={!form.name.trim() || !form.owner || isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {isSubmitting ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Custom Owner Dropdown ────────────────────────────────────────────────────

function OwnerDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center justify-between gap-2 border rounded-md px-3 py-2 text-sm bg-white min-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${open ? "border-indigo-500 ring-2 ring-indigo-500" : "border-gray-300"}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="text-gray-700">{value || "All Owners"}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {open && (
                <div className="absolute z-20 top-full left-0 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                    {["All Owners", ...OWNERS].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt === "All Owners" ? "" : opt); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${(value === opt || (!value && opt === "All Owners")) ? "bg-indigo-600 text-white hover:bg-indigo-600" : "text-gray-700"}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LineOfBusiness() {
    const { data: apiData = [], isLoading, refetch } = useGetAllLineOfBusiness();
    const [searchQuery, setSearchQuery] = useState("");
    const [ownerFilter, setOwnerFilter] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
        new Set()
    );
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);

    // Transform API response to Domain format
    const domains = useMemo(() => {
        return transformApiResponse(apiData);
    }, [apiData]);

    useEffect(() => {
        if (domains.length > 0 && expandedDomains.size === 0) {
            setExpandedDomains(new Set(domains.map((d) => d.id)));
        }
    }, [domains, expandedDomains.size]);

    // ─── Mock Data ────────────────────────────────────────────────────────────────

    // Helper function to transform API response to Domain format
    function transformApiResponse(apiData: any[]): Domain[] {
        return apiData.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            owner: item.owner || "",
            color: item.color || COLOR_OPTIONS[0],
            assets: item.assets || 0,
            createdAt: item.created_at || new Date().toISOString().split("T")[0],
            externalLinks: item.external_links || [],
            subdomains: (item.child_domain || []).map((child: any) => ({
                id: child.id,
                name: child.name,
                description: child.description || "",
                owner: child.owner || "",
                assets: child.assets || 0,
                externalLinks: child.external_links || [],
            })),
        }));
    }

    const filteredDomains = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return domains.filter((d) => {
            const matchesSearch =
                !q ||
                d.name.toLowerCase().includes(q) ||
                d.description.toLowerCase().includes(q) ||
                d.subdomains.some((sd) => sd.name.toLowerCase().includes(q));
            const matchesOwner = !ownerFilter || d.owner === ownerFilter;
            return matchesSearch && matchesOwner;
        });
    }, [domains, searchQuery, ownerFilter]);

    const totalSubdomains = useMemo(() => filteredDomains.reduce((acc, d) => acc + d.subdomains.length, 0), [filteredDomains]);
    const totalAssets = useMemo(() => filteredDomains.reduce((acc, d) => acc + d.assets, 0), [filteredDomains]);

    const collapseAll = () => setExpandedDomains(new Set());

    const toggleDomain = (id: string) => {
        setExpandedDomains((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectDomain = (id: string) => {
        setSelectedItem({ type: "domain", id });
        setPanelOpen(true);
    };

    const selectSubdomain = (sdId: string, parentId: string) => {
        setSelectedItem({ type: "subdomain", id: sdId, parentId });
        setPanelOpen(true);
    };

    const closePanel = () => {
        setPanelOpen(false);
        setSelectedItem(null);
    };

    const handleCreate = (form: ModalForm) => {
        setModalOpen(false);
        refetch();
    };

    const handleUpdate = (updated: Domain[]) => refetch();

    const handleDelete = (domainId: string) => {
        refetch();
        if (selectedItem?.id === domainId || selectedItem?.parentId === domainId) closePanel();
    };

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <Breadcrumb />
                    <div className="flex items-center gap-2.5">
                        <FolderTree className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-2xl font-semibold text-gray-900">Line of Business</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Organize data assets by business domains and sub-domains.</p>
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <button onClick={collapseAll} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Collapse All
                    </button>
                    <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Create new domain">
                        <Plus className="w-4 h-4" />
                        New Domain
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-md p-4 mb-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search domains and sub-domains..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-400"
                        aria-label="Search domains and sub-domains"
                    />
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Filter className="w-4 h-4" />
                            <span className="font-medium">Filters:</span>
                        </div>
                        <OwnerDropdown value={ownerFilter} onChange={setOwnerFilter} />
                        <span className="text-sm text-gray-500">
                            {filteredDomains.length} domain{filteredDomains.length !== 1 ? "s" : ""} · {totalSubdomains} sub-domain{totalSubdomains !== 1 ? "s" : ""} · {totalAssets.toLocaleString()} assets
                        </span>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden p-0.5 bg-gray-100 transition-all duration-100">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-white text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
                            aria-label="List view"
                            aria-pressed={viewMode === "list"}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-white text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
                            aria-label="Grid view"
                            aria-pressed={viewMode === "grid"}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === "grid" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredDomains.map((domain) => (
                            <DomainCard key={domain.id} domain={domain} />
                        ))}
                    </div>
                    {filteredDomains.length === 0 && (
                        <div className="text-center py-16 text-gray-400 text-sm">No domains match your search or filter.</div>
                    )}
                </>
            )}

            {/* List View — Split Layout */}
            {viewMode === "list" && (
                <div className="flex items-stretch max-h-[300px]">
                    {/* Left: scrollable tree */}
                    <div className={`bg-white border border-gray-200 ${panelOpen ? "rounded-tr-none rounded-br-none rounded-tl-lg rounded-bl-lg" : "rounded-md"} overflow-y-auto transition-all ${panelOpen ? "flex-[7]" : "flex-1"}`}>
                        <div className="overflow-y-auto divide-y divide-gray-100">
                            {filteredDomains.map((domain) => (
                                <DomainRow
                                    key={domain.id}
                                    domain={domain}
                                    expanded={expandedDomains.has(domain.id)}
                                    selected={selectedItem?.type === "domain" && selectedItem.id === domain.id}
                                    selectedSubdomainId={
                                        selectedItem?.type === "subdomain" && selectedItem.parentId === domain.id
                                            ? selectedItem.id
                                            : undefined
                                    }
                                    onToggle={() => toggleDomain(domain.id)}
                                    onSelect={() => selectDomain(domain.id)}
                                    onSelectSubdomain={(sdId) => selectSubdomain(sdId, domain.id)}
                                    onEditDomain={() => selectDomain(domain.id)}
                                    onDeleteDomain={() => handleDelete(domain.id)}
                                />
                            ))}
                            {filteredDomains.length === 0 && (
                                <div className="text-center py-16 text-gray-400 text-sm">No domains match your search or filter.</div>
                            )}
                        </div>
                    </div>

                    {/* Right: details panel */}
                    {panelOpen && selectedItem && (
                        <div className="flex-[3] min-w-0 flex flex-col">
                            <DetailsPanel
                                panelOpen={panelOpen}
                                domains={domains}
                                selectedItem={selectedItem}
                                onClose={closePanel}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Create modal */}
            {modalOpen && (
                <CreateDomainModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />
            )}
        </div>
    );
}