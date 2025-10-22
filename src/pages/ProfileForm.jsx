import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

function ProfileForm() {
    const [step, setStep] = useState(1); // ← ステップ管理（1=飼い主, 2=ペット）
    const navigate = useNavigate();

    const [ownerData, setOwnerData] = useState({
        username: '',
        gender: '',
        intro: '',
        ownerImage: null
    });

    const [petData, setPetData] = useState({
        petName: '',
        breed: '',
        petAge: '',
        petGender: '',
        isNeutered: false,
        petIntro: '',
        petImage: null
    });

    const handleOwnerChange = (e) => {
        const { name, value, files } = e.target;
        setOwnerData(prev => ({ ...prev, [name]: files ? files[0] : value }));
    };

    const handlePetChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setPetData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : files ? files[0] : value
        }));
    };

    const handleNext = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        let ownerImageURL = '';
        let petImageURL = '';

        if (ownerData.ownerImage) {
            const ownerRef = ref(storage, `users/${uid}/owner.jpg`);
            await uploadBytes(ownerRef, ownerData.ownerImage);
            ownerImageURL = await getDownloadURL(ownerRef);
        }

        if (petData.petImage) {
            const petRef = ref(storage, `users/${uid}/pet.jpg`);
            await uploadBytes(petRef, petData.petImage);
            petImageURL = await getDownloadURL(petRef);
        }

        await setDoc(doc(db, 'users', uid), {
            owner: {
                username: ownerData.username,
                gender: ownerData.gender,
                intro: ownerData.intro,
                ownerImageURL
            },
            pet: {
                petName: petData.petName,
                breed: petData.breed,
                petAge: parseInt(petData.petAge),
                petGender: petData.petGender,
                isNeutered: petData.petGender === "male" ? petData.isNeutered : null, // ← オスのときのみ保存
                petIntro: petData.petIntro,
                petImageURL
            },
            createdAt: serverTimestamp(),
            firstcreated: false,
        }, { merge: true });

        navigate('/home');
    };

    return (
        <div className="container py-5">
            <div className="card p-4 shadow rounded-4 mx-auto" style={{ maxWidth: '700px' }}>
                {step === 1 && (
                    <>
                        <h2 className="text-center fw-bold mb-4" style={{ color: '#ff6f61' }}>飼い主プロフィール</h2>
                        <form onSubmit={handleNext}>
                            <div className="mb-3">
                                <label className="form-label small">名前</label>
                                <input type="text" name="username" value={ownerData.username}
                                    onChange={handleOwnerChange}
                                    className="form-control form-control-sm rounded-pill" required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small">性別</label>
                                <select name="gender" value={ownerData.gender}
                                    onChange={handleOwnerChange}
                                    className="form-select form-select-sm rounded-pill" required>
                                    <option value="" hidden>選択してください</option>
                                    <option value="man">男性</option>
                                    <option value="woman">女性</option>
                                    <option value="other">その他</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small">自己紹介</label>
                                <textarea name="intro" value={ownerData.intro}
                                    onChange={handleOwnerChange}
                                    className="form-control form-control-sm rounded-4" rows={3}
                                    placeholder="簡単な自己紹介を入力してください" />
                            </div>

                            <div className="mb-4">
                                <label className="form-label small">愛犬とのツーショット</label>
                                <input type="file" accept="image/*" name="ownerImage"
                                    onChange={handleOwnerChange}
                                    className="form-control form-control-sm rounded-pill" />
                            </div>

                            <button type="submit" className="btn btn-lg w-100 rounded-pill Profile-btn shadow-sm">
                                次へ
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h3 className="text-center fw-bold mb-3" style={{ color: '#ff6f61' }}>愛犬プロフィール</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small">名前</label>
                                <input type="text" name="petName" value={petData.petName}
                                    onChange={handlePetChange}
                                    placeholder="例：ポチ"
                                    className="form-control form-control-sm rounded-pill" required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small">犬種</label>
                                <input type="text" name="breed" value={petData.breed}
                                    onChange={handlePetChange}
                                    placeholder="例：柴犬"
                                    className="form-control form-control-sm rounded-pill" required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small">年齢</label>
                                <input type="number" name="petAge" value={petData.petAge}
                                    onChange={handlePetChange}
                                    placeholder="例：3"
                                    className="form-control form-control-sm rounded-pill" min={0} required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small">性別</label>
                                <select name="petGender" value={petData.petGender}
                                    onChange={handlePetChange}
                                    className="form-select form-select-sm rounded-pill" required>
                                    <option value="" hidden>選択してください</option>
                                    <option value="male">オス</option>
                                    <option value="female">メス</option>
                                </select>
                            </div>

                            {/* ▼ オスを選んだときのみ表示 */}
                            {petData.petGender === "male" && (
                                <div className="form-check mb-3">
                                    <input className="form-check-input" type="checkbox" name="isNeutered"
                                        checked={petData.isNeutered} onChange={handlePetChange} id="isNeutered" />
                                    <label htmlFor="isNeutered" className="form-check-label small">
                                        去勢済み
                                    </label>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label small">愛犬の紹介</label>
                                <textarea name="petIntro" value={petData.petIntro}
                                    onChange={handlePetChange}
                                    className="form-control form-control-sm rounded-4" rows={3}
                                    placeholder="愛犬の性格や特徴を紹介してください" />
                            </div>

                            <div className="mb-4">
                                <label className="form-label small">愛犬の写真</label>
                                <input type="file" accept="image/*" name="petImage"
                                    onChange={handlePetChange}
                                    className="form-control form-control-sm rounded-pill" />
                            </div>

                            <div className="d-flex gap-2">
                                <button type="button" onClick={handleBack} className="btn btn-outline-secondary w-50 rounded-pill">
                                    戻る
                                </button>
                                <button type="submit" className="btn Profile-btn w-50 rounded-pill shadow-sm">
                                    保存する
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProfileForm;
