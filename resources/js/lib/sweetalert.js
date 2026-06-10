import Swal from 'sweetalert2';

/**
 * Show confirmation dialog for destructive actions
 * @param {Object} options - Configuration options
 * @param {string} options.title - Dialog title
 * @param {string} options.text - Dialog description
 * @param {string} options.confirmButtonText - Confirm button text
 * @param {string} options.icon - Icon type (warning, error, success, info, question)
 * @returns {Promise<boolean>} - Returns true if confirmed, false if cancelled
 */
export async function confirmDelete({
    title = 'Apakah Anda yakin?',
    text = 'Data yang dihapus tidak dapat dikembalikan!',
    confirmButtonText = 'Ya, Hapus!',
    cancelButtonText = 'Batal',
    icon = 'warning',
} = {}) {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
    });

    return result.isConfirmed;
}

/**
 * Show success message
 */
export function showSuccess(title = 'Berhasil!', text = '') {
    return Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: '#10b981',
    });
}

/**
 * Show error message
 */
export function showError(title = 'Gagal!', text = 'Terjadi kesalahan.') {
    return Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#ef4444',
    });
}

/**
 * Show info message
 */
export function showInfo(title = 'Informasi', text = '', html = null) {
    const config = {
        title,
        icon: 'info',
        confirmButtonColor: '#3b82f6',
    };

    if (html) {
        config.html = html;
    } else {
        config.text = text;
    }

    return Swal.fire(config);
}

/**
 * Show warning message
 */
export function showWarning(title = 'Peringatan', text = '') {
    return Swal.fire({
        title,
        text,
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
    });
}
