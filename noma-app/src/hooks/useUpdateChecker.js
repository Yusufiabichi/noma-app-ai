import { useEffect, useState } from 'react';
import { checkForUpdate, shouldShowUpdatePrompt, markUpdatePromptShown } from '../services/update.service';
import { useLanguage } from '../context/LanguageContext';
import { isOnline } from '../utils/network';

export const useUpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { language } = useLanguage(); // 'en' or 'ha'

  const check = async () => {
    // Only proceed if online
    const online = await isOnline();
    if (!online) return;

    const data = await checkForUpdate();
    if (data.updateAvailable) {
      const shouldShow = await shouldShowUpdatePrompt(data.updateAvailable);
      if (shouldShow) {
        setUpdateInfo(data);
        setShowModal(true);
        await markUpdatePromptShown();
      }
    }
  };

  useEffect(() => {
    check();
  }, []);

  const closeModal = () => setShowModal(false);

  return { updateInfo, showModal, closeModal };
};