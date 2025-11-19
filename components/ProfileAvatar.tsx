import React, { useState, useEffect } from 'react';

interface ProfileAvatarProps {
    src: string;
    alt: string;
    className: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [retryCount, setRetryCount] = useState(0);

    // Reset if the source prop changes
    useEffect(() => {
        setImgSrc(src);
        setRetryCount(0);
    }, [src]);

    const handleError = () => {
        if (retryCount === 0) {
            // Attempt 1: Try Proxy (wsrv.nl) to bypass CORS/Hotlink protection
            // This is crucial for Instagram images which often have short expiration or hotlink protection
            const encoded = encodeURIComponent(src);
            setImgSrc(`https://wsrv.nl/?url=${encoded}&w=200&h=200&output=jpg`);
            setRetryCount(1);
        } else if (retryCount === 1) {
            // Attempt 2: Fallback to UI Avatar (Generated)
            setImgSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=0f172a&color=22d3ee&size=200&bold=true&font-size=0.5`);
            setRetryCount(2);
        }
    };

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className}
            onError={handleError}
            referrerPolicy="no-referrer"
            loading="lazy"
        />
    );
};

