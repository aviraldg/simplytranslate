import React from 'react';

export default function APIConnect(Component: React.Component, fetchFn: () => Promise<object>) {
  return class extends React.Component {
    static displayName = `APIConnect(${Component.displayName || Component.name})`;
    constructor(props) {
      super(props);

      this.state = {
        loading: true,
        data: null
      }
    }

    componentDidMount() {
      this.refresh();
    }

    refresh = async() => {
      this.setState({
        loading: true
      });
      const data = await fetchFn();
      this.setState({
        data,
        loading: false
      });
      return data;
    };

    render() {
      return <Component api={{
        data: this.state.data,
        loading: this.state.loading,
        refresh: this.refresh
      }} {...this.props}/>
    }
  };
}
