import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    LifeBuoy, MessageSquare, Loader2, Search, X, Send,
    ChevronLeft, ChevronRight, Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface SupportTicket {
    id: number;
    ticket_number: string;
    user_id: number;
    subject: string;
    message: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; email: string };
    replies?: SupportTicketReply[];
}

interface SupportTicketReply {
    id: number;
    message: string;
    is_admin_reply: boolean;
    created_at: string;
    user?: { id: number; name: string };
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export function AdminSupport() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                navigate('/login');
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({
                page: currentPage.toString(),
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const response = await fetch(`${API_BASE_URL}/admin/support?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                setTickets(data.data.data || []);
                setTotalPages(data.data.last_page || 1);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        }
        setLoading(false);
    };

    const fetchTicketDetails = async (id: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/support/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setSelectedTicket(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch ticket details:', error);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchTickets();
        }
    }, [user, currentPage, statusFilter]);

    const sendReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;
        setSending(true);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/support/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ message: replyMessage }),
            });

            if (response.ok) {
                setReplyMessage('');
                fetchTicketDetails(selectedTicket.id);
            }
        } catch (error) {
            console.error('Failed to send reply:', error);
        }
        setSending(false);
    };

    const updateStatus = async (ticketId: number, status: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/admin/support/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                setTickets(tickets.map(t =>
                    t.id === ticketId ? { ...t, status: status as SupportTicket['status'] } : t
                ));
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, status: status as SupportTicket['status'] });
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            open: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-600',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority: string) => {
        const styles = {
            low: 'bg-gray-100 text-gray-600',
            medium: 'bg-orange-100 text-orange-800',
            high: 'bg-red-100 text-red-800',
        };
        return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Support Tickets" subtitle="Manage customer support requests">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-200px)]">
                {/* Tickets List */}
                <div className={`${selectedTicket ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 bg-white rounded-xl shadow-sm flex-col`}>
                    <div className="p-4 border-b space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No tickets found</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {tickets.map((ticket) => (
                                    <motion.button
                                        key={ticket.id}
                                        onClick={() => fetchTicketDetails(ticket.id)}
                                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-purple-50' : ''
                                            }`}
                                        whileHover={{ x: 2 }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-mono text-gray-500">
                                                #{ticket.ticket_number}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{ticket.message}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-400">{ticket.user?.name}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <span className="text-xs text-gray-500">Page {currentPage}/{totalPages}</span>
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 border rounded disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 border rounded disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ticket Details */}
                <div className={`${selectedTicket ? 'flex' : 'hidden lg:flex'} flex-1 bg-white rounded-xl shadow-sm flex-col`}>
                    {selectedTicket ? (
                        <>
                            <div className="p-4 sm:p-6 border-b">
                                {/* Mobile Back Button */}
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="lg:hidden flex items-center text-gray-600 hover:text-gray-900 mb-4"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-1" />
                                    Back to tickets
                                </button>
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-sm font-mono text-gray-500">
                                                #{selectedTicket.ticket_number}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(selectedTicket.priority)}`}>
                                                {selectedTicket.priority}
                                            </span>
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedTicket.subject}</h3>
                                        <p className="text-sm text-gray-500 mt-1 break-all">
                                            From: {selectedTicket.user?.name} ({selectedTicket.user?.email})
                                        </p>
                                    </div>
                                    <select
                                        value={selectedTicket.status}
                                        onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg border-0 ${getStatusBadge(selectedTicket.status)}`}
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                                {/* Original Message */}
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-gray-900">{selectedTicket.user?.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(selectedTicket.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{selectedTicket.message}</p>
                                </div>

                                {/* Replies */}
                                {selectedTicket.replies?.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className={`rounded-lg p-3 sm:p-4 ${reply.is_admin_reply
                                            ? 'bg-purple-50 ml-4 sm:ml-8'
                                            : 'bg-gray-50 mr-4 sm:mr-8'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-gray-900">
                                                {reply.is_admin_reply ? 'Support Team' : reply.user?.name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(reply.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{reply.message}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            {selectedTicket.status !== 'closed' && (
                                <div className="p-4 border-t">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                                            rows={2}
                                        />
                                        <button
                                            onClick={sendReply}
                                            disabled={sending || !replyMessage.trim()}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Select a ticket</h3>
                                <p className="text-gray-500">Choose a ticket from the list to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
