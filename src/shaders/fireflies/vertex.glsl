uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    //fireflisのポジション
    modelPosition.y += sin(uTime + modelPosition.x * 100.) * aScale * 0.1;
    modelPosition.x += cos(uTime + modelPosition.x * 100.) * aScale * 0.1;



    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    gl_PointSize = uSize * aScale * uPixelRatio * clamp(sin(uTime * 0.7), 0.5, 1.0);
    gl_PointSize *= (1.0 / - viewPosition.z); //cameraからの距離で大きさが変わる
}