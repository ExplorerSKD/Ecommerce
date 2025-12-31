<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SupportController extends Controller
{
    /**
     * Get user's support tickets
     */
    public function index(Request $request): JsonResponse
    {
        $tickets = $request->user()
            ->supportTickets()
            ->with('order:id,order_number')
            ->withCount('replies')
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Get ticket details with replies
     */
    public function show(Request $request, $id): JsonResponse
    {
        $ticket = $request->user()
            ->supportTickets()
            ->with(['order:id,order_number', 'replies.user:id,name'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ]);
    }

    /**
     * Create support ticket
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
            'category' => 'required|in:order,payment,shipping,product,account,other',
            'priority' => 'nullable|in:low,medium,high',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $ticket = $request->user()->supportTickets()->create([
            'subject' => $request->subject,
            'message' => $request->message,
            'category' => $request->category,
            'priority' => $request->priority ?? 'medium',
            'order_id' => $request->order_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Support ticket created successfully',
            'data' => $ticket,
        ], 201);
    }

    /**
     * Add reply to ticket
     */
    public function reply(Request $request, $id): JsonResponse
    {
        $ticket = $request->user()->supportTickets()->findOrFail($id);

        if (in_array($ticket->status, ['resolved', 'closed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reply to a closed ticket',
            ], 400);
        }

        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $reply = $ticket->replies()->create([
            'user_id' => $request->user()->id,
            'message' => $request->message,
            'is_admin_reply' => false,
        ]);

        // Update ticket status if it was resolved
        if ($ticket->status === 'resolved') {
            $ticket->update(['status' => 'open']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reply added successfully',
            'data' => $reply->load('user:id,name'),
        ]);
    }

    /**
     * Close ticket
     */
    public function close(Request $request, $id): JsonResponse
    {
        $ticket = $request->user()->supportTickets()->findOrFail($id);
        $ticket->close();

        return response()->json([
            'success' => true,
            'message' => 'Ticket closed successfully',
        ]);
    }

    // Admin methods

    /**
     * Admin: Get all tickets
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['user:id,name,email', 'order:id,order_number'])
            ->withCount('replies');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        $tickets = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Admin: Get ticket details
     */
    public function adminShow($id): JsonResponse
    {
        $ticket = SupportTicket::with([
            'user:id,name,email,phone',
            'order',
            'replies.user:id,name,role'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ]);
    }

    /**
     * Admin: Reply to ticket
     */
    public function adminReply(Request $request, $id): JsonResponse
    {
        $ticket = SupportTicket::findOrFail($id);

        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $reply = $ticket->replies()->create([
            'user_id' => $request->user()->id,
            'message' => $request->message,
            'is_admin_reply' => true,
        ]);

        // Update ticket status to in_progress
        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reply added successfully',
            'data' => $reply->load('user:id,name'),
        ]);
    }

    /**
     * Admin: Update ticket status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $ticket = SupportTicket::findOrFail($id);

        $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $ticket->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket status updated',
            'data' => $ticket,
        ]);
    }
}
