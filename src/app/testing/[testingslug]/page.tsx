const TestingSlug = async ({ params }) => {
     const { testingslug } = await params
    console.log('slug', testingslug)
    return (<h1>This is my testing component {testingslug}</h1>)
}

export default TestingSlug