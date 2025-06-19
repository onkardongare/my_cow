import {View, ActivityIndicator, Dimensions, Platform } from "react-native";


const Loader = ({isLoading}) => {
    const osName = Platform.OS;
    const screenHeight = Dimensions.get("screen").height;

    if (!isLoading) return null;

    return (
        <View
            className = "absolute flex justify-center items-center w-full h-full bg-primary/60 z-10"
            style = {{
                height: screenHeight,
            }}
        >
            <ActivityIndicator
                animating={isLoading}
                color = "#fff"
                size={osName === "android" ? "lafge" : 50}
            />
        </View>
    )   
}

export default Loader;