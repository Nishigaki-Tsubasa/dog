import React, { useState } from 'react';
import OwnerForm from './profile/EditOwnerProfile';
import PetForm from './profile/EditPetProfile';

const EditProfile = () => {
    const [activeTab, setActiveTab] = useState('owner'); // 'owner' or 'pet'

    return (
        <div className="container mt-4">
            <div className="d-flex mb-3">
                <button
                    className={`btn ${activeTab === 'owner' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => setActiveTab('owner')}
                >
                    飼い主情報
                </button>
                <button
                    className={`btn ${activeTab === 'pet' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('pet')}
                >
                    ペット情報
                </button>
            </div>

            <div>
                {activeTab === 'owner' && <OwnerForm />}
                {activeTab === 'pet' && <PetForm />}
            </div>
        </div>
    );
};

export default EditProfile;
