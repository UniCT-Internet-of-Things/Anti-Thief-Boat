export const getNavLinks = (isLoggedIn: boolean): string[] => {
    console.log(isLoggedIn);
    return [
        isLoggedIn ? 'Logout' : 'Login',
        'Management',
        'Alert',
    ];
};

export const Links: string[] = [
    '/',
    'management',
    'alert',
    'signin',
]

