import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';

const NotificationIcon = ({ onClick }) => {
    const [count, setCount] = useState(0);
    const user = getAuth().currentUser;

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('to', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    if (!user) return null;

    return (
        <div
            className="position-relative"
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            aria-label={`未読通知 ${count} 件`}
        >
            🔔
            {count > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {count}
                </span>
            )}
        </div>
    );
};

export default NotificationIcon;
