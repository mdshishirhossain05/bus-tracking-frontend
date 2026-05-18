export const messages = {
  success: {
    created: (entity: string) => ({
      title: `${entity} created`,
      description: `The ${entity.toLowerCase()} has been created successfully.`,
    }),

    updated: (entity: string) => ({
      title: `${entity} updated`,
      description: `The ${entity.toLowerCase()} has been updated successfully.`,
    }),

    deleted: (entity: string) => ({
      title: `${entity} deleted`,
      description: `The ${entity.toLowerCase()} has been removed successfully.`,
    }),

    saved: {
      title: "Changes saved",
      description: "Your changes have been saved successfully.",
    },

    revoked: (entity: string) => ({
      title: `${entity} revoked`,
      description: `${entity} has been revoked successfully.`,
    }),
  },

  error: {
    create: (entity: string) => ({
      title: "Create failed",
      fallback: `Failed to create ${entity.toLowerCase()}.`,
    }),

    update: (entity: string) => ({
      title: "Update failed",
      fallback: `Failed to update ${entity.toLowerCase()}.`,
    }),

    delete: (entity: string) => ({
      title: "Delete failed",
      fallback: `Failed to delete ${entity.toLowerCase()}.`,
    }),

    load: (entity: string) => ({
      description: `${entity} could not be loaded from the server.`,
    }),

    action: {
      title: "Action failed",
      fallback: "The requested action could not be completed.",
    },
  },

  conflict: {
    delete: (entity: string, details?: string) => ({
      title: "Cannot delete",
      description:
        details ||
        `This ${entity.toLowerCase()} is still referenced by active system records.`,
    }),
  },

  empty: {
    noData: (entity: string) => ({
      title: `No ${entity.toLowerCase()} found`,
      description: `Create the first ${entity.toLowerCase()} to get started.`,
    }),

    noResults: (entity: string) => ({
      title: `No matching ${entity.toLowerCase()}`,
      description:
        "Try adjusting your filters or search criteria to find what you're looking for.",
    }),
  },
};
