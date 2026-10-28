const organizationService = require("./organization.service");

async function createUser(req, res) {
  try {
    const user = await organizationService.createUser(
      req.user.organization_id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Internal server error"
    });
  }
}

async function listUsers(req, res) {
  try {
    const users = await organizationService.getOrganizationUsers(
      req.user.organization_id
    );

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function getMyOrganization(req, res) {
  try {
    const organization = await organizationService.getOrganizationById(
      req.user.organization_id
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    res.status(200).json({
      success: true,
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = { createUser, listUsers, getMyOrganization };