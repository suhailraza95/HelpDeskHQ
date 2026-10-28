const ticketService = require("./ticket.service");

async function createTicket(req, res) {
  try {
    const ticket = await ticketService.createTicket(
      req.user.organization_id,
      req.user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket
    });
  } catch (error) {
    console.error("Ticket creation error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function listTickets(req, res) {
  try {
    const result = await ticketService.listTickets(
      req.user,
      req.query
    );

    return res.status(200).json({
      success: true,
      count: result.tickets.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      tickets: result.tickets
    });
  } catch (error) {
    console.error("List tickets error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function getTicketById(req, res) {
  try {
    const ticket = await ticketService.getTicketById(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error("Get ticket error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function assignTicket(req, res) {
  try {
    const ticket = await ticketService.assignTicket(
      req.params.id,
      req.body.agentId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      ticket
    });
  } catch (error) {
    console.error("Assign ticket error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function updateTicketStatus(req, res) {
  try {
    const ticket = await ticketService.updateTicketStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket
    });
  } catch (error) {
    console.error("Update ticket status error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}


async function addTicketComment(req, res) {
  try {
    const comment = await ticketService.addTicketComment(
      req.params.id,
      req.body.comment,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment
    });
  } catch (error) {
    console.error("Add ticket comment error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function getTicketComments(req, res) {
  try {
    const comments = await ticketService.getTicketComments(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    console.error("Get ticket comments error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function getTicketHistory(req, res) {
  try {
    const history = await ticketService.getTicketHistory(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error("Get ticket history error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function getOverdueTickets(req, res) {
  try {
    const tickets = await ticketService.getOverdueTickets(req.user);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    console.error("Get overdue tickets error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function escalateTicket(req, res) {
  try {
    const ticket = await ticketService.escalateTicket(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Ticket escalated successfully",
      ticket
    });
  } catch (error) {
    console.error("Escalate ticket error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Internal server error"
    });
  }
}

async function getTicketAnalytics(req, res) {
  try {
    const analytics = await ticketService.getTicketAnalytics(req.user);

    return res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error("Ticket analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  addTicketComment,
  getTicketComments,
  getTicketHistory,
  getOverdueTickets,
  escalateTicket,
  getTicketAnalytics
};