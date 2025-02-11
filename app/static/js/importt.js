function deletePayload(id) {
    if (confirm('Are you sure you want to delete this payload?')) {
      fetch(`/delete-payload/${id}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Remove the row from the table only after successful deletion
          const row = document.querySelector(`tr[data-payload-id="${id}"]`);
          if (row) {
            row.remove();
            // Optionally show a success message
            showNotification('Payload deleted successfully', 'success');
          }
        } else {
          // Show error message if deletion failed
          showNotification('Failed to delete payload: ' + (data.message || 'Unknown error'), 'error');
        }
      })
      .catch(error => {
        console.error('Error deleting payload:', error);
        showNotification('An error occurred while deleting the payload', 'error');
      });
    }
  }