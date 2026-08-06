function ArrowLeft({ className = "" }) {

    return (

        <svg
            className={className}
            viewBox="0 0 56 26"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            aria-hidden="true"
        >

            <path
                d="
                    M16.2 4.2
                    C12.6 7.0 9.2 10.0 5.6 13
                    C9.2 16.0 12.6 19.0 16.2 21.8
                "
                stroke="currentColor"
                strokeWidth="1.55"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="
                    M6.8 13
                    C14 13
                    23 12.9
                    33 12.7
                    C40 12.6
                    46 12.8
                    52 13
                "
                stroke="currentColor"
                strokeWidth="1.55"
                strokeLinecap="round"
            />

        </svg>

    );

}

export default ArrowLeft;