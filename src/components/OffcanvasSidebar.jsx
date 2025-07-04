import SidebarMenuItems from './SidebarMenuItems';
import { Offcanvas } from 'bootstrap';
import { useEffect } from 'react';

const OffcanvasSidebar = ({ id, username, onLogout }) => {
    useEffect(() => {
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
    }, []);

    return (
        <div className="offcanvas offcanvas-start" tabIndex="-1" id={id} aria-labelledby={`${id}Label`}>
            <div className="offcanvas-header">
                <h5 id={`${id}Label`} className="offcanvas-title">メニュー</h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="閉じる" />
            </div>
            <div className="offcanvas-body d-flex flex-column">
                <div className="mb-3">
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-person-circle fs-3 text-primary"></i>
                        <div>
                            <div className="text-muted small">ようこそ</div>
                            <div className="fw-bold">{username ?? '名無し'}</div>
                        </div>
                    </div>
                </div>
                <nav className="nav flex-column gap-2">
                    <SidebarMenuItems onLinkClick={() => {
                        const el = document.getElementById(id);
                        if (el) bootstrap.Offcanvas.getInstance(el)?.hide();
                    }} />
                </nav>
                <div className="mt-auto">
                    <button onClick={onLogout} className="btn btn-outline-danger w-100 rounded-pill">
                        <i className="bi bi-box-arrow-right"></i> ログアウト
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OffcanvasSidebar;
