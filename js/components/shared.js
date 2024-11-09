/**
 * Shared UI components and utilities
 * Common components used across multiple pages
 */
const Shared = {
    // Modal component
    Modal: {
        show(options) {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${options.title}</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">${options.content}</div>
                    <div class="modal-footer">
                        ${options.footer || ''}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            
            modal.querySelector('.close-btn').addEventListener('click', () => {
                this.close(modal);
            });

            return modal;
        },

        close(modal) {
            modal.remove();
        }
    },

    // Data table component
    DataTable: {
        create(container, options) {
            const table = document.createElement('table');
            table.className = 'data-table';
            
            // Header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    ${options.columns.map(col => `<th>${col.label}</th>`).join('')}
                </tr>
            `;
            table.appendChild(thead);

            // Body
            const tbody = document.createElement('tbody');
            options.data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = options.columns
                    .map(col => `<td>${row[col.field]}</td>`)
                    .join('');
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            container.appendChild(table);
            return table;
        }
    },

    // Form builder
    Form: {
        create(options) {
            const form = document.createElement('form');
            form.className = 'shared-form';

            options.fields.forEach(field => {
                const div = document.createElement('div');
                div.className = 'form-group';
                
                const label = document.createElement('label');
                label.textContent = field.label;
                label.htmlFor = field.id;
                div.appendChild(label);

                const input = document.createElement('input');
                input.type = field.type || 'text';
                input.id = field.id;
                input.name = field.name;
                input.required = field.required || false;
                div.appendChild(input);

                if (field.validation) {
                    input.addEventListener('input', () => {
                        const result = field.validation(input.value);
                        input.setCustomValidity(result.isValid ? '' : result.message);
                    });
                }

                form.appendChild(div);
            });

            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.textContent = options.submitText || 'Submit';
            form.appendChild(submitBtn);

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (options.onSubmit) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    options.onSubmit(data);
                }
            });

            return form;
        }
    },

    // Loading indicator
    LoadingIndicator: {
        show(container) {
            const loader = document.createElement('div');
            loader.className = 'loading-indicator';
            loader.innerHTML = '<div class="spinner"></div>';
            container.appendChild(loader);
            return loader;
        },

        hide(loader) {
            loader.remove();
        }
    },

    // Confirmation dialog
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.Modal.show({
                title: options.title || 'Confirm',
                content: message,
                footer: `
                    <button class="btn-cancel">${options.cancelText || 'Cancel'}</button>
                    <button class="btn-confirm">${options.confirmText || 'Confirm'}</button>
                `
            });

            modal.querySelector('.btn-cancel').addEventListener('click', () => {
                this.Modal.close(modal);
                resolve(false);
            });

            modal.querySelector('.btn-confirm').addEventListener('click', () => {
                this.Modal.close(modal);
                resolve(true);
            });
        });
    }
};

export default Shared;